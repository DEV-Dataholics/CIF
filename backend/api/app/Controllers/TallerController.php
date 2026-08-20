<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class TallerController extends BaseController
{
    private function db() { return \Config\Database::connect(); }

    private function json(array $data, int $code = 200): ResponseInterface
    {
        $origin = $this->request->getHeaderLine('Origin') ?: 'http://localhost';
        return $this->response
            ->setHeader('Access-Control-Allow-Origin', $origin)
            ->setHeader('Access-Control-Allow-Credentials', 'true')
            ->setStatusCode($code)->setJSON($data);
    }

    // ── GET /taller/solicitudes ───────────────────────────────
    public function solicitudes(): ResponseInterface
    {
        $lista = $this->db()->query("
            SELECT
                s.*,
                t.numero_economico AS economico,
                t.marca, t.modelo,
                o.nombre_completo AS operador
            FROM solicitudes_taller s
            JOIN tractocamiones t ON t.id = s.tractocamion_id
            JOIN operadores o     ON o.id = s.operador_id
            ORDER BY
                FIELD(s.urgencia,'sos','alta','media','baja'),
                s.created_at DESC
        ")->getResultArray();

        return $this->json(['ok' => true, 'solicitudes' => $lista]);
    }

    // ── POST /taller/solicitudes (admin/taller crea manualmente) ──
    public function crearSolicitud(): ResponseInterface
    {
        $data = $this->request->getJSON(true);

        $required = ['tractocamion_id', 'operador_id', 'problema'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return $this->json(['ok' => false, 'error' => "El campo $field es requerido."], 422);
            }
        }

        $insert = [
            'tractocamion_id' => (int)$data['tractocamion_id'],
            'operador_id'     => (int)$data['operador_id'],
            'problema'        => $data['problema'],
            'urgencia'        => $data['urgencia'] ?? 'media',
            'puede_operar'    => isset($data['puede_operar']) ? (int)$data['puede_operar'] : 1,
            'estatus'         => 'pendiente',
        ];

        $id = $this->db()->table('solicitudes_taller')->insert($insert, true);

        // Si no puede operar → tracto pasa a en_taller automáticamente
        if (empty($data['puede_operar'])) {
            $this->db()->table('tractocamiones')
                ->where('id', $data['tractocamion_id'])
                ->update(['estatus' => 'en_taller']);
        }

        return $this->json(['ok' => true, 'id' => $id], 201);
    }

    // ── PUT /taller/solicitudes/:id ───────────────────────────
    public function actualizarSolicitud(int $id): ResponseInterface
    {
        $data = $this->request->getJSON(true);
        $this->db()->table('solicitudes_taller')->where('id', $id)->update($data);
        return $this->json(['ok' => true]);
    }

    // ── POST /taller/sos (desde app operador) ─────────────────
    public function sos(): ResponseInterface
    {
        $userId = session()->get('user_id');
        $db     = $this->db();
        $op     = $db->table('operadores')->where('usuario_id', $userId)->get()->getRowArray();

        if (!$op) {
            return $this->json(['ok' => false, 'error' => 'Operador no encontrado.'], 404);
        }

        $tracto = $db->table('tractocamiones')
            ->where('operador_asignado_id', $op['id'])
            ->get()->getRowArray();

        if (!$tracto) {
            return $this->json(['ok' => false, 'error' => 'No tienes un tracto asignado.'], 404);
        }

        $data = $this->request->getJSON(true);

        $db->table('solicitudes_taller')->insert([
            'tractocamion_id' => $tracto['id'],
            'operador_id'     => $op['id'],
            'problema'        => $data['problema'] ?? 'Sin descripción',
            'urgencia'        => 'sos',
            'puede_operar'    => isset($data['puede_operar']) ? (int)$data['puede_operar'] : 0,
            'estatus'         => 'pendiente',
        ]);

        // SOS = el tracto queda bloqueado en taller
        if (empty($data['puede_operar'])) {
            $db->table('tractocamiones')
               ->where('id', $tracto['id'])
               ->update(['estatus' => 'en_taller']);
        }

        return $this->json(['ok' => true, 'mensaje' => 'Alerta SOS enviada.']);
    }

    // ── GET /taller/ordenes ───────────────────────────────────
    public function ordenes(): ResponseInterface
    {
        $ordenes = $this->db()->query("
            SELECT
                o.*,
                t.numero_economico AS economico, t.marca, t.modelo,
                s.problema AS solicitud_origen,
                s.urgencia
            FROM ordenes_servicio_taller o
            JOIN tractocamiones t ON t.id = o.tractocamion_id
            LEFT JOIN solicitudes_taller s ON s.id = o.solicitud_id
            ORDER BY
                FIELD(o.estatus,'en_proceso','abierta','terminada','cancelada'),
                o.id DESC
        ")->getResultArray();

        return $this->json(['ok' => true, 'ordenes' => $ordenes]);
    }

    // ── POST /taller/ordenes (crear orden de servicio) ────────
    public function crearOrden(): ResponseInterface
    {
        $data = $this->request->getJSON(true);

        $required = ['tractocamion_id', 'descripcion'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return $this->json(['ok' => false, 'error' => "El campo $field es requerido."], 422);
            }
        }

        $insert = [
            'tractocamion_id'      => (int)$data['tractocamion_id'],
            'solicitud_id'         => $data['solicitud_id'] ?? null,
            'tipo'                 => $data['tipo'] ?? 'correctivo',
            'descripcion'          => $data['descripcion'],
            'mecanico_responsable' => $data['mecanico_responsable'] ?? null,
            'fecha_inicio'         => $data['fecha_inicio'] ?? date('Y-m-d H:i:s'),
            'costo_estimado'       => $data['costo_estimado'] ?? 0,
            'estatus'              => 'abierta',
        ];

        $id = $this->db()->table('ordenes_servicio_taller')->insert($insert, true);

        // El tracto pasa a en_taller al abrir una orden
        $this->db()->table('tractocamiones')
            ->where('id', $data['tractocamion_id'])
            ->update(['estatus' => 'en_taller']);

        return $this->json(['ok' => true, 'id' => $id], 201);
    }

    // ── PUT /taller/ordenes/:id ───────────────────────────────
    public function actualizarOrden(int $id): ResponseInterface
    {
        $data  = $this->request->getJSON(true);
        $db    = $this->db();

        $db->table('ordenes_servicio_taller')->where('id', $id)->update($data);

        // Al terminar la orden → tracto vuelve a disponible
        if (($data['estatus'] ?? '') === 'terminada') {
            $orden = $db->table('ordenes_servicio_taller')->where('id', $id)->get()->getRowArray();
            if ($orden) {
                $db->table('tractocamiones')
                   ->where('id', $orden['tractocamion_id'])
                   ->update(['estatus' => 'disponible']);
            }
        }

        return $this->json(['ok' => true]);
    }

    // ── GET /taller/catalogos (para formularios) ──────────────
    public function catalogos(): ResponseInterface
    {
        $db = $this->db();
        return $this->json([
            'ok'         => true,
            'tractos'    => $db->table('tractocamiones')
                               ->select('id, numero_economico, marca, modelo, estatus')
                               ->orderBy('numero_economico')
                               ->get()->getResultArray(),
            'operadores' => $db->table('operadores')
                               ->select('id, nombre_completo, numero_operador')
                               ->where('activo', 1)
                               ->get()->getResultArray(),
        ]);
    }

    // ── GET /taller/checklists ────────────────────────────────
    public function checklists(): ResponseInterface
    {
        $db = $this->db();
        $lista = $db->table('taller_checklists')
            ->orderBy('fecha_creacion', 'DESC')
            ->get()->getResultArray();

        // Convert metricas and visual JSON/Text strings back to arrays
        foreach ($lista as &$item) {
            $item['metricas'] = json_decode($item['metricas'] ?? '{}', true);
            $item['visual'] = json_decode($item['visual'] ?? '{}', true);
        }

        return $this->json(['ok' => true, 'data' => $lista]);
    }

    // ── POST /taller/checklists ───────────────────────────────
    public function crearChecklist(): ResponseInterface
    {
        $data = $this->request->getJSON(true);
        $db = $this->db();

        $insert = [
            'tipo'            => $data['tipo'] ?? 'tractor',
            'tractocamion_id' => !empty($data['tractocamion_id']) ? (int)$data['tractocamion_id'] : null,
            'caja_id'         => !empty($data['caja_id']) ? (int)$data['caja_id'] : null,
            'odometro'        => $data['odometro'] ?? null,
            'responsable'     => $data['responsable'] ?? 'Desconocido',
            'hora_inicio'     => $data['hora_inicio'] ?? null,
            'hora_fin'        => $data['hora_fin'] ?? null,
            'observaciones'   => $data['observaciones'] ?? null,
            'metricas'        => json_encode($data['metricas'] ?? new \stdClass()),
            'visual'          => json_encode($data['visual'] ?? new \stdClass()),
            'fecha_creacion'  => date('Y-m-d H:i:s')
        ];

        $id = $db->table('taller_checklists')->insert($insert, true);

        // Get the inserted record to return it
        $row = $db->table('taller_checklists')->where('id', $id)->get()->getRowArray();
        if ($row) {
            $row['metricas'] = json_decode($row['metricas'], true);
            $row['visual'] = json_decode($row['visual'], true);
        }

        return $this->json(['ok' => true, 'data' => $row], 201);
    }

    // ── PUT /taller/checklists/:id ────────────────────────────
    public function actualizarChecklist(int $id): ResponseInterface
    {
        $data = $this->request->getJSON(true);
        $db = $this->db();

        $update = [];
        if (isset($data['tipo'])) $update['tipo'] = $data['tipo'];
        if (isset($data['tractocamion_id'])) $update['tractocamion_id'] = !empty($data['tractocamion_id']) ? (int)$data['tractocamion_id'] : null;
        if (isset($data['caja_id'])) $update['caja_id'] = !empty($data['caja_id']) ? (int)$data['caja_id'] : null;
        if (isset($data['odometro'])) $update['odometro'] = $data['odometro'];
        if (isset($data['responsable'])) $update['responsable'] = $data['responsable'];
        if (isset($data['hora_inicio'])) $update['hora_inicio'] = $data['hora_inicio'];
        if (isset($data['hora_fin'])) $update['hora_fin'] = $data['hora_fin'];
        if (isset($data['observaciones'])) $update['observaciones'] = $data['observaciones'];
        if (isset($data['metricas'])) $update['metricas'] = json_encode($data['metricas']);
        if (isset($data['visual'])) $update['visual'] = json_encode($data['visual']);

        if (!empty($update)) {
            $db->table('taller_checklists')->where('id', $id)->update($update);
        }

        $row = $db->table('taller_checklists')->where('id', $id)->get()->getRowArray();
        if ($row) {
            $row['metricas'] = json_decode($row['metricas'], true);
            $row['visual'] = json_decode($row['visual'], true);
        }

        return $this->json(['ok' => true, 'data' => $row]);
    }
}
