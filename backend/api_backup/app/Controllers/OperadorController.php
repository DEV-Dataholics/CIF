<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

/**
 * CIF — OperadorController
 * CRUD de operadores + vista de sus viajes (para PWA).
 */
class OperadorController extends BaseController
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

    /** GET /api/operadores */
    public function index(): ResponseInterface
    {
        $operadores = $this->db()->query("
            SELECT o.*, t.numero_economico AS tracto_asignado
            FROM operadores o
            LEFT JOIN tractocamiones t ON t.operador_asignado_id = o.id
            WHERE o.activo = 1
            ORDER BY o.nombre_completo ASC
        ")->getResultArray();

        return $this->json(['ok' => true, 'operadores' => $operadores, 'total' => count($operadores)]);
    }

    /** GET /api/operadores/{id} */
    public function show(int $id): ResponseInterface
    {
        $op = $this->db()->table('operadores')->where('id', $id)->get()->getRowArray();
        if (!$op) return $this->json(['ok' => false, 'mensaje' => 'Operador no encontrado'], 404);
        return $this->json(['ok' => true, 'operador' => $op]);
    }

    /** POST /api/operadores */
    public function create(): ResponseInterface
    {
        $rol = session()->get('user_rol');
        if (!in_array($rol, ['admin', 'trafico'])) {
            return $this->json(['ok' => false, 'mensaje' => 'Sin permiso'], 403);
        }
        $data = $this->request->getJSON(true);
        if (empty($data['nombre_completo']) || empty($data['numero_operador'])) {
            return $this->json(['ok' => false, 'mensaje' => 'Nombre y número de operador son requeridos'], 400);
        }
        $id = $this->db()->table('operadores')->insert($data, true);
        return $this->json(['ok' => true, 'id' => $id, 'mensaje' => 'Operador creado'], 201);
    }

    /** PUT /api/operadores/{id} */
    public function update(int $id): ResponseInterface
    {
        $rol = session()->get('user_rol');
        if (!in_array($rol, ['admin', 'trafico'])) {
            return $this->json(['ok' => false, 'mensaje' => 'Sin permiso'], 403);
        }
        $data = $this->request->getJSON(true);
        unset($data['id'], $data['created_at']);
        $this->db()->table('operadores')->where('id', $id)->update($data);
        return $this->json(['ok' => true, 'mensaje' => 'Operador actualizado']);
    }

    /**
     * GET /api/operadores/mis-viajes
     * Vista propia del operador autenticado — alimenta la PWA.
     */
    public function misViajes(): ResponseInterface
    {
        $userId = session()->get('user_id');
        $db     = $this->db();

        $op = $db->table('operadores')->where('usuario_id', $userId)->get()->getRowArray();
        if (!$op) return $this->json(['ok' => false, 'error' => 'No se encontró el registro de operador'], 404);

        $viajes = $db->query("
            SELECT
                v.id, v.tipo_movimiento, v.origen, v.destino,
                v.estatus, v.fecha_salida, v.foto_voucher,
                v.notas, v.puntos_asignados,
                t.numero_economico, c.numero_caja
            FROM viajes v
            LEFT JOIN tractocamiones t ON t.id = v.tractocamion_id
            LEFT JOIN cajas c ON c.id = v.caja_id
            WHERE v.operador_id = ?
              AND v.estatus NOT IN ('facturado')
            ORDER BY v.updated_at DESC
            LIMIT 20
        ", [$op['id']])->getResultArray();

        return $this->json(['ok' => true, 'operador' => $op, 'viajes' => $viajes]);
    }
}
