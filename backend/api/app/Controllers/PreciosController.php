<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class PreciosController extends BaseController
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
        $items = $this->db()->table('precios')->orderBy('id', 'ASC')->get()->getResultArray();
        return $this->json($items);
    }

    public function create(): ResponseInterface
    {
        $raw = $this->request->getJSON(true) ?? [];
        $data = [
            'cliente_id'     => $raw['cliente_id'] ?? null,
            'tipo_mov_id'    => $raw['tipo_mov_id'] ?? null,
            'precio'         => $raw['precio'] ?? 0,
            'fecha_vigencia' => $raw['fecha_vigencia'] ?? null,
            'created_at'     => date('Y-m-d H:i:s'),
            'updated_at'     => date('Y-m-d H:i:s'),
        ];

        $this->db()->table('precios')->insert($data);
        $insertId = $this->db()->insertID();
        return $this->json(['ok' => true, 'id' => $insertId, 'data' => array_merge(['id' => $insertId], $data)], 201);
    }

    public function update($id = null): ResponseInterface
    {
        $raw = $this->request->getJSON(true) ?? [];
        $data = ['updated_at' => date('Y-m-d H:i:s')];
        if (isset($raw['cliente_id'])) $data['cliente_id'] = $raw['cliente_id'];
        if (isset($raw['tipo_mov_id'])) $data['tipo_mov_id'] = $raw['tipo_mov_id'];
        if (isset($raw['precio'])) $data['precio'] = $raw['precio'];
        if (isset($raw['fecha_vigencia'])) $data['fecha_vigencia'] = $raw['fecha_vigencia'];

        $this->db()->table('precios')->where('id', $id)->update($data);
        return $this->json(['ok' => true, 'status' => 'updated']);
    }

    public function delete($id = null): ResponseInterface
    {
        $this->db()->table('precios')->where('id', $id)->delete();
        return $this->json(['ok' => true, 'id' => $id]);
    }
}
