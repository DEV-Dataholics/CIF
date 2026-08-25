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

    public function update(int $id): \CodeIgniter\HTTP\ResponseInterface
    {
        $raw = $this->request->getJSON(true);
        $data = [];
        if (isset($raw['numeroEconomico'])) $data['numero_economico'] = $raw['numeroEconomico'];
        if (isset($raw['placas'])) $data['placas_mx'] = $raw['placas'];
        if (isset($raw['marca'])) $data['marca'] = $raw['marca'];
        if (isset($raw['modelo'])) $data['modelo'] = $raw['modelo'];
        if (isset($raw['anio'])) $data['anio'] = $raw['anio'];
        if (isset($raw['estatus'])) $data['estatus'] = $raw['estatus'];
        if (isset($raw['activo'])) $data['activo'] = $raw['activo'] ? 1 : 0;
        if (isset($raw['vigenciaSCT'])) $data['vencimiento_sct'] = $raw['vigenciaSCT'];
        if (isset($raw['vigenciaSeguro'])) $data['vencimiento_poliza_mx'] = $raw['vigenciaSeguro'];
        
        if (!empty($data)) {
            \Config\Database::connect()->table('tractocamiones')->where('id', $id)->update($data);
        }
        return $this->json(['ok' => true]);
    }

    public function delete(int $id): ResponseInterface
    {
        try {
            \Config\Database::connect()->table('tractocamiones')->where('id', $id)->delete();
            return $this->json(['ok' => true]);
        } catch (\Exception $e) {
            // Foreign key constraints can fail the deletion. We catch it.
            return $this->json(['ok' => false, 'error' => 'No se puede eliminar el tractocamión porque está asignado a otras tablas.'], 409);
        }
    }
}
