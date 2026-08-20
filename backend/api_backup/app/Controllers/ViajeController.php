<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

/**
 * CIF — ViajeController
 * CRUD de viajes + cambio de estatus + subida de voucher.
 *
 * Regla R1: No se puede crear viaje con tracto en estatus 'en_taller'.
 * Regla R2: Para pasar a 'entregado' es obligatorio que foto_voucher no sea null.
 * Gamificación: Al pasar a 'entregado', se asignan puntos automáticamente.
 */
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

    /** GET /api/viajes */
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

        // Operador solo ve sus viajes
        if ($rol === 'operador') {
            $op = $db->table('operadores')->where('usuario_id', $userId)->get()->getRowArray();
            if ($op) $builder->where('v.operador_id', $op['id']);
        }

        $viajes = $builder->get()->getResultArray();
        return $this->json(['ok' => true, 'viajes' => $viajes, 'total' => count($viajes)]);
    }

    /** GET /api/viajes/catalogos — tractos disponibles, cajas libres, operadores, clientes */
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

    /** GET /api/viajes/{id} */
    public function show(int $id): ResponseInterface
    {
        $viaje = $this->db()->query("
            SELECT v.*, o.nombre_completo AS operador, t.numero_economico AS economico,
                   c.numero_caja, cl.razon_social AS cliente
            FROM viajes v
            LEFT JOIN operadores o ON o.id = v.operador_id
            LEFT JOIN tractocamiones t ON t.id = v.tractocamion_id
            LEFT JOIN cajas c ON c.id = v.caja_id
            LEFT JOIN clientes cl ON cl.id = v.cliente_id
            WHERE v.id = ?
        ", [$id])->getRowArray();

        if (!$viaje) return $this->json(['ok' => false, 'mensaje' => 'Viaje no encontrado'], 404);
        return $this->json(['ok' => true, 'viaje' => $viaje]);
    }

    /** POST /api/viajes — crear viaje (Tráfico/Admin) */
    public function create(): ResponseInterface
    {
        $rol = session()->get('user_rol');
        if (!in_array($rol, ['admin', 'trafico'])) {
            return $this->json(['ok' => false, 'mensaje' => 'Sin permiso para crear viajes'], 403);
        }

        $data = $this->request->getJSON(true);

        // ── REGLA R1: Tracto no puede estar en taller ──
        $tracto = $this->db()->table('tractocamiones')
            ->where('id', $data['tractocamion_id'] ?? 0)
            ->get()->getRowArray();

        if (!$tracto) {
            return $this->json(['ok' => false, 'error' => 'Tractocamión no encontrado'], 404);
        }
        if ($tracto['estatus'] === 'en_taller') {
            return $this->json([
                'ok'    => false,
                'error' => "🚫 El tractocamión {$tracto['numero_economico']} está en TALLER y no puede asignarse. Elige otra unidad.",
            ], 422);
        }

        $insert = [
            'cliente_id'      => $data['cliente_id']      ?? null,
            'operador_id'     => $data['operador_id'],
            'tractocamion_id' => $data['tractocamion_id'],
            'caja_id'         => $data['caja_id']         ?? null,
            'tipo_movimiento' => $data['tipo_movimiento'],
            'origen'          => $data['origen'],
            'destino'         => $data['destino'],
            'via_cruce'       => $data['via_cruce']       ?? null,
            'fecha_salida'    => $data['fecha_salida']    ?? date('Y-m-d H:i:s'),
            'notas'           => $data['notas']           ?? null,
            'estatus'         => 'asignado',
            'created_by'      => session()->get('user_id'),
        ];

        $db = $this->db();
        $id = $db->table('viajes')->insert($insert, true);

        // Actualizar estatus del tracto
        $db->table('tractocamiones')->where('id', $insert['tractocamion_id'])->update(['estatus' => 'en_ruta', 'updated_at' => date('Y-m-d H:i:s')]);

        // Bloquear la caja si se asignó
        if ($insert['caja_id']) {
            $db->table('cajas')->where('id', $insert['caja_id'])->update(['estatus' => 'en_viaje', 'updated_at' => date('Y-m-d H:i:s')]);
        }

        return $this->json(['ok' => true, 'id' => $id, 'mensaje' => 'Viaje creado correctamente'], 201);
    }

    /** PUT /api/viajes/{id}/estatus */
    public function cambiarEstatus(int $id): ResponseInterface
    {
        $db     = $this->db();
        $viaje  = $db->table('viajes')->where('id', $id)->get()->getRowArray();
        if (!$viaje) return $this->json(['ok' => false, 'error' => 'Viaje no encontrado'], 404);

        $data      = $this->request->getJSON(true);
        $newEstatus = $data['estatus'] ?? '';

        $flujoValido = [
            'solicitado'  => 'asignado',
            'asignado'    => 'en_transito',
            'en_transito' => 'en_aduana',
            'en_aduana'   => 'entregado',
            'entregado'   => 'documentado',
            'documentado' => 'facturado',
        ];

        if (($flujoValido[$viaje['estatus']] ?? '') !== $newEstatus) {
            return $this->json(['ok' => false, 'error' => "Transición inválida: {$viaje['estatus']} → {$newEstatus}"], 422);
        }

        // ── REGLA R2: Foto voucher obligatoria para pasar a "entregado" ──
        if ($newEstatus === 'entregado' && empty($viaje['foto_voucher'])) {
            return $this->json([
                'ok'    => false,
                'error' => '📷 Se requiere foto del voucher para confirmar la entrega. Súbela primero.',
            ], 422);
        }

        $db->table('viajes')->where('id', $id)->update([
            'estatus'      => $newEstatus,
            'updated_at'   => date('Y-m-d H:i:s'),
            'fecha_llegada'=> in_array($newEstatus, ['entregado']) ? date('Y-m-d H:i:s') : null,
        ]);

        // Liberar tracto y caja si el viaje termina
        if ($newEstatus === 'entregado') {
            $db->table('tractocamiones')->where('id', $viaje['tractocamion_id'])
                ->update(['estatus' => 'disponible', 'updated_at' => date('Y-m-d H:i:s')]);
            if ($viaje['caja_id']) {
                $db->table('cajas')->where('id', $viaje['caja_id'])
                    ->update(['estatus' => 'disponible', 'updated_at' => date('Y-m-d H:i:s')]);
            }
            // Asignar puntos de gamificación
            $this->asignarPuntos($viaje);
        }

        return $this->json(['ok' => true, 'mensaje' => "Estatus actualizado a: {$newEstatus}"]);
    }

    /** POST /api/viajes/{id}/voucher — subir foto del comprobante */
    public function subirVoucher(int $id): ResponseInterface
    {
        $file = $this->request->getFile('voucher');
        if (!$file || !$file->isValid()) {
            return $this->json(['ok' => false, 'error' => 'No se recibió ningún archivo válido'], 400);
        }
        if (!$file->isImage()) {
            return $this->json(['ok' => false, 'error' => 'Solo se aceptan imágenes (jpg, png, webp)'], 400);
        }

        $nombreArchivo = $id . '_' . time() . '.' . $file->getExtension();
        $file->move(WRITEPATH . 'uploads/vouchers/', $nombreArchivo);

        $ruta = 'uploads/vouchers/' . $nombreArchivo;
        $this->db()->table('viajes')->where('id', $id)->update([
            'foto_voucher' => $ruta,
            'updated_at'   => date('Y-m-d H:i:s'),
        ]);

        return $this->json(['ok' => true, 'ruta' => $ruta, 'mensaje' => 'Voucher subido correctamente']);
    }

    /** POST /api/viajes/registrar — registro rápido desde PWA del operador */
    public function registrarMovimiento(): ResponseInterface
    {
        $userId = session()->get('user_id');
        $db     = $this->db();

        $op = $db->table('operadores')->where('usuario_id', $userId)->get()->getRowArray();
        if (!$op) return $this->json(['ok' => false, 'error' => 'Operador no encontrado'], 404);

        // Buscar su tracto asignado
        $tracto = $db->table('tractocamiones')
            ->where('operador_asignado_id', $op['id'])
            ->get()->getRowArray();

        $tipo  = $this->request->getPost('tipo');
        $origen= $this->request->getPost('origen');
        $destino=$this->request->getPost('destino');
        $notas = $this->request->getPost('notas');

        if (!$tipo || !$origen || !$destino) {
            return $this->json(['ok' => false, 'error' => 'Tipo, origen y destino son requeridos'], 400);
        }

        // Subir foto del voucher
        $file = $this->request->getFile('voucher');
        if (!$file || !$file->isValid()) {
            return $this->json(['ok' => false, 'error' => '📷 La foto del voucher es obligatoria'], 400);
        }

        $nombreArchivo = $op['id'] . '_' . time() . '.' . $file->getExtension();
        $file->move(WRITEPATH . 'uploads/vouchers/', $nombreArchivo);
        $ruta = 'uploads/vouchers/' . $nombreArchivo;

        $insert = [
            'operador_id'     => $op['id'],
            'tractocamion_id' => $tracto['id'] ?? 1,
            'tipo_movimiento' => $tipo,
            'origen'          => $origen,
            'destino'         => $destino,
            'notas'           => $notas,
            'foto_voucher'    => $ruta,
            'estatus'         => 'entregado',
            'fecha_salida'    => date('Y-m-d H:i:s'),
            'fecha_llegada'   => date('Y-m-d H:i:s'),
            'created_by'      => $userId,
        ];

        $id = $db->table('viajes')->insert($insert, true);

        // Gamificación: asignar puntos
        $puntos = in_array($tipo, ['local_cargado','exportacion','importacion','recoleccion']) ? 2 : 1;
        $semana = (int)date('W');
        $anio   = (int)date('Y');
        $db->table('puntos_operador')->insert([
            'operador_id'   => $op['id'],
            'viaje_id'      => $id,
            'puntos_ganados'=> $puntos,
            'tipo_evento'   => in_array($tipo, ['local_cargado','exportacion','importacion','recoleccion']) ? 'viaje_cargado' : 'viaje_vacio',
            'semana'        => $semana,
            'anio'          => $anio,
        ]);

        return $this->json(['ok' => true, 'id' => $id, 'puntos' => $puntos, 'mensaje' => 'Movimiento registrado']);
    }

    /** Asigna puntos de gamificación después de marcar entregado */
    private function asignarPuntos(array $viaje): void
    {
        $tiposCargados = ['local_cargado','exportacion','importacion','recoleccion','interplanta'];
        $puntos = in_array($viaje['tipo_movimiento'], $tiposCargados) ? 2 : 1;
        $evento = in_array($viaje['tipo_movimiento'], $tiposCargados) ? 'viaje_cargado' : 'viaje_vacio';

        $this->db()->table('puntos_operador')->insert([
            'operador_id'   => $viaje['operador_id'],
            'viaje_id'      => $viaje['id'],
            'puntos_ganados'=> $puntos,
            'tipo_evento'   => $evento,
            'semana'        => (int)date('W'),
            'anio'          => (int)date('Y'),
        ]);

        $this->db()->table('viajes')->where('id', $viaje['id'])->update(['puntos_asignados' => $puntos]);
    }
}
