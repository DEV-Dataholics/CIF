<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class ClientesController extends BaseController
{
    private function db()
    {
        return \Config\Database::connect();
    }

    private function json(array $data, int $code = 200): ResponseInterface
    {
        $origin = $this->request->getHeaderLine('Origin') ?: 'http://localhost';
        return $this->response
            ->setHeader('Access-Control-Allow-Origin', $origin)
            ->setHeader('Access-Control-Allow-Credentials', 'true')
            ->setStatusCode($code)
            ->setJSON($data);
    }

    public function index(): ResponseInterface
    {
        $clientes = $this->db()->table('clientes')
            ->orderBy('id', 'DESC')
            ->get()
            ->getResultArray();

        // Map database fields to snake_case / camelCase compat
        foreach ($clientes as &$c) {
            $c['razonSocial'] = $c['razon_social'] ?? '';
            $c['activo'] = (bool)($c['activo'] ?? true);
        }

        return $this->json(['ok' => true, 'clientes' => $clientes]);
    }

    public function show(int $id): ResponseInterface
    {
        $cliente = $this->db()->table('clientes')->where('id', $id)->get()->getRowArray();
        if (!$cliente) {
            return $this->json(['ok' => false, 'error' => 'Cliente no encontrado.'], 404);
        }
        $cliente['razonSocial'] = $cliente['razon_social'] ?? '';
        $cliente['activo'] = (bool)($cliente['activo'] ?? true);
        return $this->json(['ok' => true, 'cliente' => $cliente]);
    }

    public function create(): ResponseInterface
    {
        $data = $this->request->getJSON(true);
        
        $insertData = [
            'razon_social' => $data['razonSocial'] ?? ($data['razon_social'] ?? ''),
            'tipo'         => $data['tipo'] ?? 'maquiladora',
            'activo'       => isset($data['activo']) ? (int)$data['activo'] : 1
        ];

        if (empty($insertData['razon_social'])) {
            return $this->json(['ok' => false, 'error' => 'El campo Razón Social es requerido.'], 422);
        }

        $id = $this->db()->table('clientes')->insert($insertData, true);
        return $this->json(['ok' => true, 'id' => $id], 201);
    }

    public function update(int $id): ResponseInterface
    {
        $data = $this->request->getJSON(true);
        
        $updateData = [];
        if (isset($data['razonSocial']) || isset($data['razon_social'])) {
            $updateData['razon_social'] = $data['razonSocial'] ?? $data['razon_social'];
        }
        if (isset($data['tipo'])) {
            $updateData['tipo'] = $data['tipo'];
        }
        if (isset($data['activo'])) {
            $updateData['activo'] = (int)$data['activo'];
        }

        if (empty($updateData)) {
            return $this->json(['ok' => false, 'error' => 'No hay datos válidos para actualizar.'], 400);
        }

        $this->db()->table('clientes')->where('id', $id)->update($updateData);
        return $this->json(['ok' => true]);
    }

    public function delete(int $id): ResponseInterface
    {
        // Delete client
        $this->db()->table('clientes')->where('id', $id)->delete();
        return $this->json(['ok' => true]);
    }
}
