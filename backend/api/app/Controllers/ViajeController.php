<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class ViajeController extends BaseController
{
    private function db() { return \Config\Database::connect(); }
    private function json(array $data, int $code = 200): ResponseInterface
    {
        $origin = $this->request->getHeaderLine('Origin') ?: 'http://127.0.0.1:5500';
        return $this->response
            ->setHeader('Access-Control-Allow-Origin', $origin)
            ->setHeader('Access-Control-Allow-Credentials', 'true')
            ->setStatusCode($code)->setJSON($data);
    }

    public function index(): ResponseInterface
    {
        $userId = session()->get('user_id');
        $rol    = session()->get('user_rol');
        $db     = $this->db();

        $builder = $db->table('viajes v')
            ->select('v.*, o.nombre_completo AS operador, t.numero_economico AS economico, c.numero_caja, cl.razon_social AS cliente')
            ->join('operadores o', 'o.id = v.operador_id', 'left')
            ->join('tractocamiones t', 't.id = v.tractocamion_id', 'left')
            ->join('cajas c', 'c.id = v.caja_id', 'left')
            ->join('clientes cl', 'cl.id = v.cliente_id', 'left')
            ->orderBy('v.updated_at', 'DESC');

        if ($rol === 'operador') {
            $op = $db->table('operadores')->where('usuario_id', $userId)->get()->getRowArray();
            if ($op) $builder->where('v.operador_id', $op['id']);
        }

        return $this->json(['ok' => true, 'viajes' => $builder->get()->getResultArray()]);
    }

    public function catalogos(): ResponseInterface
    {
        $db = $this->db();
        return $this->json([
            'ok' => true,
            'operadores'         => $db->table('operadores')->where('activo', 1)->get()->getResultArray(),
            'tractos_disponibles'=> $db->table('tractocamiones')->where('estatus', 'disponible')->get()->getResultArray(),
            'cajas_disponibles'  => $db->table('cajas')->where('estatus', 'disponible')->get()->getResultArray(),
            'clientes'           => $db->table('clientes')->where('activo', 1)->get()->getResultArray(),
        ]);
    }

    public function create(): ResponseInterface
    {
        $data = $this->request->getJSON(true);

        // ── REGLA R1: Tracto no taller ──
        $tracto = $this->db()->table('tractocamiones')->where('id', $data['tractocamion_id'])->get()->getRowArray();
        if ($tracto['estatus'] === 'en_taller') {
            return $this->json(['ok' => false, 'error' => "El tracto {$tracto['numero_economico']} está en taller."], 422);
        }

        $id = $this->db()->table('viajes')->insert($data + ['estatus' => 'asignado', 'created_by' => session()->get('user_id')], true);
        $this->db()->table('tractocamiones')->where('id', $data['tractocamion_id'])->update(['estatus' => 'en_ruta']);

        // F1.4: Sincronizar caja → en_viaje
        if (!empty($data['caja_id'])) {
            $this->db()->table('cajas')->where('id', $data['caja_id'])->update(['estatus' => 'en_viaje']);
        }

        return $this->json(['ok' => true, 'id' => $id], 201);
    }

    public function cambiarEstatus(int $id): ResponseInterface
    {
        $db    = $this->db();
        $viaje = $db->table('viajes')->where('id', $id)->get()->getRowArray();
        $data  = $this->request->getJSON(true);
        $new   = $data['estatus'];

        // ── REGLA R2: Foto para entregado ──
        if ($new === 'entregado' && empty($viaje['foto_voucher'])) {
            return $this->json(['ok' => false, 'error' => 'La foto del voucher es obligatoria.'], 422);
        }

        $updateData = ['estatus' => $new];
        if (isset($data['folio_boleta'])) {
            $updateData['folio_boleta'] = $data['folio_boleta'];
        }
        $db->table('viajes')->where('id', $id)->update($updateData);

        if ($new === 'entregado') {
            $db->table('tractocamiones')->where('id', $viaje['tractocamion_id'])->update(['estatus' => 'disponible']);
            // F1.4: Liberar caja al entregar
            if (!empty($viaje['caja_id'])) {
                $db->table('cajas')->where('id', $viaje['caja_id'])->update(['estatus' => 'disponible']);
            }
            $this->asignarPuntos($viaje);
        }

        return $this->json(['ok' => true]);
    }

    public function registrarMovimiento(): ResponseInterface
    {
        $userId = session()->get('user_id');
        $db     = $this->db();
        $op     = $db->table('operadores')->where('usuario_id', $userId)->get()->getRowArray();
        $tracto = $db->table('tractocamiones')->where('operador_asignado_id', $op['id'])->get()->getRowArray();

        $file = $this->request->getFile('voucher');
        if (!$file || !$file->isValid()) return $this->json(['ok' => false, 'error' => 'Foto requerida'], 400);

        $nombre = $op['id'] . '_' . time() . '.' . $file->getExtension();
        $file->move(WRITEPATH . 'uploads/vouchers/', $nombre);
        $ruta = 'uploads/vouchers/' . $nombre;

        $tipo = $this->request->getPost('tipo');
        $insert = [
            'operador_id'     => $op['id'],
            'tractocamion_id' => $tracto['id'] ?? 1,
            'tipo_movimiento' => $tipo,
            'origen'          => $this->request->getPost('origen'),
            'destino'         => $this->request->getPost('destino'),
            'foto_voucher'    => $ruta,
            'estatus'         => 'entregado',
            'created_by'      => $userId,
        ];

        $id = $db->table('viajes')->insert($insert, true);
        $this->asignarPuntos($insert + ['id' => $id]);

        return $this->json(['ok' => true, 'mensaje' => 'Registrado']);
    }

    private function asignarPuntos(array $viaje): void
    {
        $puntos = in_array($viaje['tipo_movimiento'], ['exportacion','importacion','recoleccion']) ? 2 : 1;
        $this->db()->table('puntos_operador')->insert([
            'operador_id'   => $viaje['operador_id'],
            'viaje_id'      => $viaje['id'],
            'puntos_ganados'=> $puntos,
            'tipo_evento'   => $puntos === 2 ? 'viaje_cargado' : 'viaje_vacio',
            'semana'        => (int)date('W'),
            'anio'          => (int)date('Y'),
        ]);
        $this->db()->table('viajes')->where('id', $viaje['id'])->update(['puntos_asignados' => $puntos]);
    }

    public function subirVoucher(int $id): ResponseInterface
    {
        $file = $this->request->getFile('voucher');
        if (!$file->isValid()) return $this->json(['ok'=>false], 400);
        $nombre = $id . '_' . time() . '.' . $file->getExtension();
        $file->move(WRITEPATH . 'uploads/vouchers/', $nombre);
        $this->db()->table('viajes')->where('id', $id)->update(['foto_voucher' => 'uploads/vouchers/' . $nombre]);
        return $this->json(['ok'=>true]);
    }

    // ── F3.1: Facturación ────────────────────────────────────────
    public function facturacion(): ResponseInterface
    {
        $viajes = $this->db()->query("
            SELECT
                v.id, v.tipo_movimiento, v.origen, v.destino, v.estatus,
                v.foto_voucher, v.notas, v.created_at, v.updated_at,
                v.folio_boleta,
                o.nombre_completo AS operador,
                t.numero_economico AS economico,
                c.numero_caja,
                cl.razon_social AS cliente,
                cl.precio_cartaporte
            FROM viajes v
            LEFT JOIN operadores o     ON o.id = v.operador_id
            LEFT JOIN tractocamiones t ON t.id = v.tractocamion_id
            LEFT JOIN cajas c          ON c.id = v.caja_id
            LEFT JOIN clientes cl      ON cl.id = v.cliente_id
            WHERE v.estatus IN ('documentado','facturado')
            ORDER BY v.updated_at DESC
        ")->getResultArray();

        $pendientes = count(array_filter($viajes, fn($v) => $v['estatus'] === 'documentado'));

        return $this->json([
            'ok'               => true,
            'viajes'           => $viajes,
            'total'            => count($viajes),
            'pendientes_facturar' => $pendientes,
        ]);
    }

    public function facturar(int $id): ResponseInterface
    {
        $data  = $this->request->getJSON(true);
        $db    = $this->db();
        $viaje = $db->table('viajes')->where('id', $id)->get()->getRowArray();

        if (!$viaje) {
            return $this->json(['ok' => false, 'error' => 'Viaje no encontrado.'], 404);
        }
        if ($viaje['estatus'] !== 'documentado') {
            return $this->json(['ok' => false, 'error' => 'Solo se pueden facturar viajes con estatus "documentado".'], 422);
        }

        $db->table('viajes')->where('id', $id)->update([
            'estatus'      => 'facturado',
            'folio_boleta' => $data['folio_boleta'] ?? null,
        ]);

        return $this->json(['ok' => true, 'mensaje' => 'Viaje facturado exitosamente.']);
    }

    // ── F3.2: Regla R3 — Alerta rendimiento diésel ───────────────
    private function verificarRendimientoDiesel(array $viaje): void
    {
        if (empty($viaje['rendimiento_real']) || empty($viaje['tractocamion_id'])) return;

        $db     = $this->db();
        $tracto = $db->table('tractocamiones')
                     ->select('rendimiento_objetivo, numero_economico, operador_asignado_id')
                     ->where('id', $viaje['tractocamion_id'])
                     ->get()->getRowArray();

        if (!$tracto || !$tracto['rendimiento_objetivo']) return;

        $objetivo = (float)$tracto['rendimiento_objetivo'];
        $real     = (float)$viaje['rendimiento_real'];
        $diferencia = (($objetivo - $real) / $objetivo) * 100;

        // Si el rendimiento real fue >5% menor al objetivo → alerta de taller
        if ($diferencia > 5.0) {
            $db->table('solicitudes_taller')->insert([
                'tractocamion_id' => $viaje['tractocamion_id'],
                'operador_id'     => $viaje['operador_id'],
                'problema'        => sprintf(
                    'ALERTA DIÉSEL (R3): Rendimiento bajo en viaje #%d. Objetivo: %.2f km/l — Real: %.2f km/l (%.1f%% bajo lo esperado).',
                    $viaje['id'], $objetivo, $real, $diferencia
                ),
                'urgencia'        => 'alta',
                'puede_operar'    => 1,
                'estatus'         => 'pendiente',
            ]);
        }
    }

    public function destinosCatalogos(): ResponseInterface
    {
        return $this->json([
            'ok' => true,
            'destinos' => [
                [ 'id' => 1, 'nombre' => 'Planta Licom', 'tipo' => 'cliente', 'ciudad' => 'Cd. Juárez' ],
                [ 'id' => 2, 'nombre' => 'Planta Foxconn', 'tipo' => 'cliente', 'ciudad' => 'Cd. Juárez' ],
                [ 'id' => 3, 'nombre' => 'Planta Biopapel', 'tipo' => 'cliente', 'ciudad' => 'Cd. Juárez' ],
                [ 'id' => 4, 'nombre' => 'Planta Sumitomo', 'tipo' => 'cliente', 'ciudad' => 'Cd. Juárez' ],
                [ 'id' => 5, 'nombre' => 'Planta DANGIL', 'tipo' => 'cliente', 'ciudad' => 'Cd. Juárez' ],
                [ 'id' => 6, 'nombre' => 'Puente Comercio Mundial (Zaragoza)', 'tipo' => 'cruce', 'ciudad' => 'Cd. Juárez' ],
                [ 'id' => 7, 'nombre' => 'Puente Lerdo / Paso del Norte', 'tipo' => 'cruce', 'ciudad' => 'Cd. Juárez' ],
                [ 'id' => 8, 'nombre' => 'Bridge of the Americas', 'tipo' => 'cruce', 'ciudad' => 'El Paso TX' ],
                [ 'id' => 9, 'nombre' => 'Ysleta - Zaragoza Bridge', 'tipo' => 'cruce', 'ciudad' => 'El Paso TX' ],
                [ 'id' => 10, 'nombre' => 'Base CIF — Patio Juárez', 'tipo' => 'base', 'ciudad' => 'Cd. Juárez' ],
                [ 'id' => 11, 'nombre' => 'Taller CIF', 'tipo' => 'taller', 'ciudad' => 'Cd. Juárez' ],
                [ 'id' => 12, 'nombre' => 'Rampa / Anden de Descarga', 'tipo' => 'operacion', 'ciudad' => 'Cd. Juárez' ],
                [ 'id' => 13, 'nombre' => 'Almacén Interplanta', 'tipo' => 'operacion', 'ciudad' => 'Cd. Juárez' ],
                [ 'id' => 14, 'nombre' => 'Gasolinera Ruta Norte', 'tipo' => 'servicio', 'ciudad' => 'Cd. Juárez' ],
                [ 'id' => 15, 'nombre' => 'Aduana Exterior', 'tipo' => 'cruce', 'ciudad' => 'Cd. Juárez' ],
                [ 'id' => 16, 'nombre' => 'Monterrey (Foránea)', 'tipo' => 'foraneo', 'ciudad' => 'Monterrey' ],
                [ 'id' => 17, 'nombre' => 'CDMX (Foránea)', 'tipo' => 'foraneo', 'ciudad' => 'CDMX' ],
                [ 'id' => 18, 'nombre' => 'Guadalajara (Foránea)', 'tipo' => 'foraneo', 'ciudad' => 'Guadalajara' ]
            ]
        ]);
    }
}
