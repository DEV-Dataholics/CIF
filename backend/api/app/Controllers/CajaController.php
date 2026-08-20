<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class CajaController extends BaseController
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

    public function index(): ResponseInterface
    {
        $cajas = $this->db()->query("
            SELECT c.*, cl.razon_social AS cliente_nombre
            FROM cajas c
            LEFT JOIN clientes cl ON cl.id = c.cliente_asignado_id
            WHERE c.activo = 1
            ORDER BY c.numero_caja
        ")->getResultArray();

        return $this->json(['ok' => true, 'cajas' => $cajas]);
    }

    public function show(int $id): ResponseInterface
    {
        $caja = $this->db()->query("
            SELECT c.*, cl.razon_social AS cliente_nombre
            FROM cajas c
            LEFT JOIN clientes cl ON cl.id = c.cliente_asignado_id
            WHERE c.id = ?
        ", [$id])->getRowArray();

        if (!$caja) return $this->json(['ok' => false], 404);
        return $this->json(['ok' => true, 'caja' => $caja]);
    }

    public function create(): ResponseInterface
    {
        $data = $this->request->getJSON(true);

        $required = ['numero_caja', 'tipo', 'placas_mx'];
        foreach ($required as $f) {
            if (empty($data[$f])) {
                return $this->json(['ok' => false, 'error' => "El campo $f es requerido."], 422);
            }
        }

        // Verificar que el número de caja no exista
        $existe = $this->db()->table('cajas')->where('numero_caja', $data['numero_caja'])->countAllResults();
        if ($existe > 0) {
            return $this->json(['ok' => false, 'error' => 'El número de caja ya existe.'], 409);
        }

        $insert = [
            'numero_caja'  => strtoupper(trim($data['numero_caja'])),
            'tipo'         => $data['tipo'],
            'placas_mx'    => strtoupper(trim($data['placas_mx'])),
            'placas_usa'   => isset($data['placas_usa']) ? strtoupper(trim($data['placas_usa'])) : null,
            'estatus'      => 'disponible',
            'activo'       => 1,
        ];

        $id = $this->db()->table('cajas')->insert($insert, true);
        return $this->json(['ok' => true, 'id' => $id], 201);
    }

    public function update(int $id): ResponseInterface
    {
        $data = $this->request->getJSON(true);
        unset($data['id'], $data['activo']);
        $this->db()->table('cajas')->where('id', $id)->update($data);
        return $this->json(['ok' => true]);
    }

    public function asignar(int $id): ResponseInterface
    {
        $data      = $this->request->getJSON(true);
        $clienteId = $data['cliente_id'] ?? null;
        $db        = $this->db();

        $caja = $db->table('cajas')->where('id', $id)->get()->getRowArray();
        if (!$caja) return $this->json(['ok' => false], 404);

        if ($clienteId) {
            $db->table('cajas')->where('id', $id)->update([
                'cliente_asignado_id' => $clienteId,
                'estatus'             => 'en_cliente',
            ]);
        } else {
            $db->table('cajas')->where('id', $id)->update([
                'cliente_asignado_id' => null,
                'estatus'             => 'disponible',
            ]);
        }

        return $this->json(['ok' => true]);
    }
}

