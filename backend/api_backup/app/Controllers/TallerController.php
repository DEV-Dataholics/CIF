<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

/**
 * CIF — TallerController
 * Gestiona solicitudes SOS y órdenes de servicio.
 * Regla R3: si costo_diesel tiene delta > 5%, genera alerta (lógica referenciada).
 */
class TallerController extends BaseController
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

    // ── SOLICITUDES ───────────────────────────────────────────

    /** GET /api/taller/solicitudes */
    public function solicitudes(): ResponseInterface
    {
        $lista = $this->db()->query("
            SELECT s.*, t.numero_economico AS economico, o.nombre_completo AS operador
            FROM solicitudes_taller s
            JOIN tractocamiones t ON t.id = s.tractocamion_id
            JOIN operadores o ON o.id = s.operador_id
            ORDER BY
                FIELD(s.urgencia, 'sos','alta','media','baja'),
                FIELD(s.estatus, 'pendiente','en_proceso','resuelto','cancelado'),
                s.created_at DESC
        ")->getResultArray();

        return $this->json(['ok' => true, 'solicitudes' => $lista]);
    }

    /** POST /api/taller/sos — desde la PWA del operador */
    public function sos(): ResponseInterface
    {
        $userId = session()->get('user_id');
        $db     = $this->db();

        $op = $db->table('operadores')->where('usuario_id', $userId)->get()->getRowArray();
        if (!$op) return $this->json(['ok' => false, 'error' => 'Operador no encontrado'], 404);

        $tracto = $db->table('tractocamiones')
            ->where('operador_asignado_id', $op['id'])
            ->get()->getRowArray();
        if (!$tracto) return $this->json(['ok' => false, 'error' => 'No tienes un tractocamión asignado'], 404);

        $body = $this->request->getJSON(true);
        $id   = $db->table('solicitudes_taller')->insert([
            'tractocamion_id' => $tracto['id'],
            'operador_id'     => $op['id'],
            'problema'        => $body['problema']     ?? 'Sin detalle',
            'urgencia'        => $body['urgencia']     ?? 'alta',
            'puede_operar'    => $body['puede_operar'] ?? true,
            'estatus'         => 'pendiente',
        ], true);

        // Si no puede operar, marcar tracto en taller
        if (empty($body['puede_operar'])) {
            $db->table('tractocamiones')->where('id', $tracto['id'])
                ->update(['estatus' => 'en_taller', 'updated_at' => date('Y-m-d H:i:s')]);
        }

        return $this->json(['ok' => true, 'id' => $id, 'mensaje' => '🚨 Alerta SOS enviada al equipo de taller'], 201);
    }

    /** POST /api/taller/solicitudes */
    public function crearSolicitud(): ResponseInterface
    {
        $data = $this->request->getJSON(true);
        $id   = $this->db()->table('solicitudes_taller')->insert($data, true);
        return $this->json(['ok' => true, 'id' => $id], 201);
    }

    /** PUT /api/taller/solicitudes/{id} */
    public function actualizarSolicitud(int $id): ResponseInterface
    {
        $rol = session()->get('user_rol');
        if (!in_array($rol, ['admin', 'taller'])) {
            return $this->json(['ok' => false, 'mensaje' => 'Sin permiso'], 403);
        }
        $data = $this->request->getJSON(true);
        $data['updated_at'] = date('Y-m-d H:i:s');
        $this->db()->table('solicitudes_taller')->where('id', $id)->update($data);
        return $this->json(['ok' => true, 'mensaje' => 'Solicitud actualizada']);
    }

    // ── ÓRDENES DE SERVICIO ───────────────────────────────────

    /** GET /api/taller/ordenes */
    public function ordenes(): ResponseInterface
    {
        $ordenes = $this->db()->query("
            SELECT o.*, t.numero_economico AS economico
            FROM ordenes_servicio_taller o
            JOIN tractocamiones t ON t.id = o.tractocamion_id
            ORDER BY FIELD(o.estatus,'abierta','en_proceso','terminada','cancelada'), o.created_at DESC
        ")->getResultArray();

        return $this->json(['ok' => true, 'ordenes' => $ordenes]);
    }

    /** POST /api/taller/ordenes */
    public function crearOrden(): ResponseInterface
    {
        $rol = session()->get('user_rol');
        if (!in_array($rol, ['admin', 'taller'])) {
            return $this->json(['ok' => false, 'mensaje' => 'Sin permiso'], 403);
        }
        $data = $this->request->getJSON(true);
        $id   = $this->db()->table('ordenes_servicio_taller')->insert($data, true);

        // Marcar tracto en taller si hay orden abierta
        if (!empty($data['tractocamion_id'])) {
            $this->db()->table('tractocamiones')->where('id', $data['tractocamion_id'])
                ->update(['estatus' => 'en_taller', 'updated_at' => date('Y-m-d H:i:s')]);
        }

        return $this->json(['ok' => true, 'id' => $id, 'mensaje' => 'Orden creada'], 201);
    }

    /** PUT /api/taller/ordenes/{id} */
    public function actualizarOrden(int $id): ResponseInterface
    {
        $rol = session()->get('user_rol');
        if (!in_array($rol, ['admin', 'taller'])) {
            return $this->json(['ok' => false, 'mensaje' => 'Sin permiso'], 403);
        }
        $data = $this->request->getJSON(true);

        // Si se cierra la orden, liberar el tracto
        if (($data['estatus'] ?? '') === 'terminada') {
            $orden = $this->db()->table('ordenes_servicio_taller')->where('id', $id)->get()->getRowArray();
            if ($orden) {
                $data['fecha_fin'] = date('Y-m-d H:i:s');
                // Verificar si hay otras órdenes abiertas para el mismo tracto
                $otrasAbiertas = $this->db()->table('ordenes_servicio_taller')
                    ->where('tractocamion_id', $orden['tractocamion_id'])
                    ->whereIn('estatus', ['abierta', 'en_proceso'])
                    ->where('id !=', $id)
                    ->countAllResults();
                if ($otrasAbiertas === 0) {
                    $this->db()->table('tractocamiones')
                        ->where('id', $orden['tractocamion_id'])
                        ->update(['estatus' => 'disponible', 'updated_at' => date('Y-m-d H:i:s')]);
                }
            }
        }

        $data['updated_at'] = date('Y-m-d H:i:s');
        $this->db()->table('ordenes_servicio_taller')->where('id', $id)->update($data);
        return $this->json(['ok' => true, 'mensaje' => 'Orden actualizada']);
    }
}
