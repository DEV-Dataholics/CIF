<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

/**
 * CIF — TractocamionController
 * CRUD de la flota de tractocamiones.
 * Regla R1: no se puede asignar un tracto en estatus 'en_taller'.
 */
class TractocamionController extends BaseController
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

    /** GET /api/tractocamiones */
    public function index(): ResponseInterface
    {
        $db     = $this->db();
        $tractos = $db->query("
            SELECT
                t.*,
                o.nombre_completo AS operador_nombre
            FROM tractocamiones t
            LEFT JOIN operadores o ON o.id = t.operador_asignado_id
            ORDER BY t.estatus ASC, t.numero_economico ASC
        ")->getResultArray();

        return $this->json(['ok' => true, 'tractos' => $tractos, 'total' => count($tractos)]);
    }

    /** GET /api/tractocamiones/{id} */
    public function show(int $id): ResponseInterface
    {
        $tracto = $this->db()->table('tractocamiones')->where('id', $id)->get()->getRowArray();
        if (!$tracto) return $this->json(['ok' => false, 'mensaje' => 'Tracto no encontrado'], 404);
        return $this->json(['ok' => true, 'tracto' => $tracto]);
    }

    /** POST /api/tractocamiones */
    public function create(): ResponseInterface
    {
        $rol = session()->get('user_rol');
        if (!in_array($rol, ['admin', 'trafico'])) {
            return $this->json(['ok' => false, 'mensaje' => 'Sin permiso para crear tractos'], 403);
        }
        $data = $this->request->getJSON(true);
        if (empty($data['numero_economico'])) {
            return $this->json(['ok' => false, 'mensaje' => 'Número económico requerido'], 400);
        }
        $id = $this->db()->table('tractocamiones')->insert($data, true);
        return $this->json(['ok' => true, 'id' => $id, 'mensaje' => 'Tractocamión creado'], 201);
    }

    /** PUT /api/tractocamiones/{id} */
    public function update(int $id): ResponseInterface
    {
        $rol = session()->get('user_rol');
        if (!in_array($rol, ['admin', 'trafico', 'taller'])) {
            return $this->json(['ok' => false, 'mensaje' => 'Sin permiso'], 403);
        }
        $data = $this->request->getJSON(true);
        unset($data['id'], $data['created_at']);
        $data['updated_at'] = date('Y-m-d H:i:s');
        $this->db()->table('tractocamiones')->where('id', $id)->update($data);
        return $this->json(['ok' => true, 'mensaje' => 'Actualizado correctamente']);
    }
}
