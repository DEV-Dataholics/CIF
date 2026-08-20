<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class TractocamionController extends BaseController
{
    private function json(array $data, int $code = 200): ResponseInterface
    {
        $origin = $this->request->getHeaderLine('Origin') ?: 'http://127.0.0.1:5500';
        return $this->response
            ->setHeader('Access-Control-Allow-Origin', $origin)
            ->setHeader('Access-Control-Allow-Credentials', 'true')
            ->setStatusCode($code)->setJSON($data);
    }

    public function index(): ResponseInterface
    {
        $db = \Config\Database::connect();
        $tractos = $db->query("
            SELECT t.*, o.nombre_completo AS operador_nombre
            FROM tractocamiones t
            LEFT JOIN operadores o ON o.id = t.operador_asignado_id
            ORDER BY t.numero_economico ASC
        ")->getResultArray();
        return $this->json(['ok' => true, 'tractos' => $tractos]);
    }

    public function show(int $id): ResponseInterface
    {
        $tracto = \Config\Database::connect()->table('tractocamiones')->where('id', $id)->get()->getRowArray();
        if (!$tracto) return $this->json(['ok' => false], 404);
        return $this->json(['ok' => true, 'tracto' => $tracto]);
    }

    public function create(): ResponseInterface
    {
        $data = $this->request->getJSON(true);
        $id   = \Config\Database::connect()->table('tractocamiones')->insert($data, true);
        return $this->json(['ok' => true, 'id' => $id], 201);
    }

    public function update(int $id): ResponseInterface
    {
        $data = $this->request->getJSON(true);
        unset($data['id']);
        \Config\Database::connect()->table('tractocamiones')->where('id', $id)->update($data);
        return $this->json(['ok' => true]);
    }
}
