<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

/**
 * CIF — CajaController
 * CRUD de cajas (trailers). Incluye asignación a cliente que bloquea disponibilidad.
 */
class CajaController extends BaseController
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

    /** GET /api/cajas */
    public function index(): ResponseInterface
    {
        $cajas = $this->db()->query("
            SELECT c.*, cl.razon_social AS cliente_nombre
            FROM cajas c
            LEFT JOIN clientes cl ON cl.id = c.cliente_asignado_id
            WHERE c.activo = 1
            ORDER BY c.estatus ASC, c.numero_caja ASC
        ")->getResultArray();

        return $this->json(['ok' => true, 'cajas' => $cajas, 'total' => count($cajas)]);
    }

    /** GET /api/cajas/{id} */
    public function show(int $id): ResponseInterface
    {
        $caja = $this->db()->table('cajas')->where('id', $id)->get()->getRowArray();
        if (!$caja) return $this->json(['ok' => false, 'mensaje' => 'Caja no encontrada'], 404);
        return $this->json(['ok' => true, 'caja' => $caja]);
    }

    /** POST /api/cajas */
    public function create(): ResponseInterface
    {
        $rol = session()->get('user_rol');
        if (!in_array($rol, ['admin', 'trafico'])) {
            return $this->json(['ok' => false, 'mensaje' => 'Sin permiso'], 403);
        }
        $data = $this->request->getJSON(true);
        if (empty($data['numero_caja'])) {
            return $this->json(['ok' => false, 'mensaje' => 'Número de caja requerido'], 400);
        }
        $id = $this->db()->table('cajas')->insert($data, true);
        return $this->json(['ok' => true, 'id' => $id, 'mensaje' => 'Caja creada'], 201);
    }

    /** PUT /api/cajas/{id} */
    public function update(int $id): ResponseInterface
    {
        $rol = session()->get('user_rol');
        if (!in_array($rol, ['admin', 'trafico'])) {
            return $this->json(['ok' => false, 'mensaje' => 'Sin permiso'], 403);
        }
        $data = $this->request->getJSON(true);
        unset($data['id'], $data['created_at']);
        $data['updated_at'] = date('Y-m-d H:i:s');
        $this->db()->table('cajas')->where('id', $id)->update($data);
        return $this->json(['ok' => true, 'mensaje' => 'Caja actualizada']);
    }

    /**
     * PUT /api/cajas/{id}/asignar
     * Asigna (o libera) una caja a un cliente — bloquea su disponibilidad.
     */
    public function asignar(int $id): ResponseInterface
    {
        $rol = session()->get('user_rol');
        if (!in_array($rol, ['admin', 'trafico'])) {
            return $this->json(['ok' => false, 'mensaje' => 'Sin permiso para asignar cajas'], 403);
        }

        $data       = $this->request->getJSON(true);
        $clienteId  = $data['cliente_id'] ?? null;
        $db         = $this->db();

        $caja = $db->table('cajas')->where('id', $id)->get()->getRowArray();
        if (!$caja) return $this->json(['ok' => false, 'error' => 'Caja no encontrada'], 404);

        if ($clienteId) {
            // Asignar — bloquear caja
            if ($caja['estatus'] !== 'disponible') {
                return $this->json(['ok' => false, 'error' => "La caja {$caja['numero_caja']} no está disponible (estatus: {$caja['estatus']})"], 422);
            }
            $db->table('cajas')->where('id', $id)->update([
                'cliente_asignado_id' => $clienteId,
                'estatus'             => 'en_cliente',
                'updated_at'          => date('Y-m-d H:i:s'),
            ]);
            return $this->json(['ok' => true, 'mensaje' => "Caja {$caja['numero_caja']} asignada al cliente"]);
        } else {
            // Liberar caja
            $db->table('cajas')->where('id', $id)->update([
                'cliente_asignado_id' => null,
                'estatus'             => 'disponible',
                'updated_at'          => date('Y-m-d H:i:s'),
            ]);
            return $this->json(['ok' => true, 'mensaje' => "Caja {$caja['numero_caja']} liberada"]);
        }
    }
}
