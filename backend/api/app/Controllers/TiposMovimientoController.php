<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class TiposMovimientoController extends BaseController
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
        $items = $this->db()->table('tiposmovimiento')->orderBy('id', 'ASC')->get()->getResultArray();
        return $this->json($items);
    }

    public function create(): ResponseInterface
    {
        $raw = $this->request->getJSON(true) ?? [];
        $data = [
            'nombre'          => trim($raw['nombre'] ?? ''),
            'clienteAsociado' => $raw['clienteAsociado'] ?? 'NA',
            'created_at'      => date('Y-m-d H:i:s'),
            'updated_at'      => date('Y-m-d H:i:s'),
        ];

        if (empty($data['nombre'])) {
            return $this->json(['ok' => false, 'error' => 'El nombre del tipo de movimiento es requerido.'], 422);
        }

        $this->db()->table('tiposmovimiento')->insert($data);
        $insertId = $this->db()->insertID();
        return $this->json(['ok' => true, 'id' => $insertId, 'data' => array_merge(['id' => $insertId], $data)], 201);
    }

    public function update($id = null): ResponseInterface
    {
        $raw = $this->request->getJSON(true) ?? [];
        $data = ['updated_at' => date('Y-m-d H:i:s')];
        if (isset($raw['nombre'])) $data['nombre'] = trim($raw['nombre']);
        if (isset($raw['clienteAsociado'])) $data['clienteAsociado'] = $raw['clienteAsociado'];

        $this->db()->table('tiposmovimiento')->where('id', $id)->update($data);
        return $this->json(['ok' => true, 'status' => 'updated']);
    }

    public function delete($id = null): ResponseInterface
    {
        $this->db()->table('tiposmovimiento')->where('id', $id)->delete();
        $this->db()->table('precios')->where('tipo_mov_id', $id)->delete();
        return $this->json(['ok' => true, 'id' => $id]);
    }
}
