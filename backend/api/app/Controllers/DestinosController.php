<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class DestinosController extends BaseController
{
    private function db()
    {
        return \Config\Database::connect();
    }

    private function json(array $data, int $code = 200): ResponseInterface
    {
        $origin = $this->request->getHeaderLine('Origin');
        if (empty($origin)) {
            $origin = 'http://localhost';
        }
        return $this->response
            ->setHeader('Access-Control-Allow-Origin', $origin)
            ->setHeader('Access-Control-Allow-Credentials', 'true')
            ->setStatusCode($code)
            ->setJSON($data);
    }

    public function index(): ResponseInterface
    {
        $items = $this->db()->table('destinos')->orderBy('nombre', 'ASC')->get()->getResultArray();
        return $this->json(['ok' => true, 'destinos' => $items]);
    }

    public function create(): ResponseInterface
    {
        $raw = $this->request->getJSON(true) ?? [];
        $nombre = trim($raw['nombre'] ?? '');
        if (empty($nombre)) {
            return $this->json(['ok' => false, 'error' => 'El nombre del destino/ubicación es requerido.'], 422);
        }

        $data = [
            'nombre'     => $nombre,
            'tipo'       => $raw['tipo'] ?? 'ciudad',
            'ciudad'     => $raw['ciudad'] ?? 'Juárez',
            'estado'     => $raw['estado'] ?? 'Chihuahua',
            'pais'       => $raw['pais'] ?? 'México',
            'activo'     => isset($raw['activo']) ? (int)$raw['activo'] : 1,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ];

        $this->db()->table('destinos')->insert($data);
        $insertId = $this->db()->insertID();

        return $this->json(['ok' => true, 'id' => $insertId, 'data' => array_merge(['id' => $insertId], $data)], 201);
    }

    public function update($id = null): ResponseInterface
    {
        $raw = $this->request->getJSON(true) ?? [];
        $data = array_filter([
            'nombre'     => isset($raw['nombre']) ? trim($raw['nombre']) : null,
            'tipo'       => $raw['tipo'] ?? null,
            'ciudad'     => $raw['ciudad'] ?? null,
            'estado'     => $raw['estado'] ?? null,
            'pais'       => $raw['pais'] ?? null,
            'activo'     => isset($raw['activo']) ? (int)$raw['activo'] : null,
            'updated_at' => date('Y-m-d H:i:s'),
        ], fn($v) => $v !== null);

        if (!empty($data) && $id) {
            $this->db()->table('destinos')->where('id', $id)->update($data);
        }

        return $this->json(['ok' => true, 'status' => 'updated']);
    }

    public function delete($id = null): ResponseInterface
    {
        if ($id) {
            $this->db()->table('destinos')->where('id', $id)->delete();
        }
        return $this->json(['ok' => true, 'id' => $id]);
    }
}
