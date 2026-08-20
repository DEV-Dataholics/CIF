<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class PorteriaController extends BaseController
{
    private function json(array $data, int $code = 200): ResponseInterface
    {
        $origin = $this->request->getHeaderLine('Origin') ?: 'http://127.0.0.1:5500';
        return $this->response
            ->setHeader('Access-Control-Allow-Origin', $origin)
            ->setHeader('Access-Control-Allow-Credentials', 'true')
            ->setStatusCode($code)->setJSON($data);
    }

    public function bitacora(): ResponseInterface
    {
        $registros = \Config\Database::connect()->query("
            SELECT b.*, t.numero_economico AS economico, o.nombre_completo AS operador, TIME(b.fecha_hora) AS hora
            FROM bitacora_porteria b
            LEFT JOIN tractocamiones t ON t.id = b.tractocamion_id
            LEFT JOIN operadores o ON o.id = b.operador_id
            WHERE DATE(b.fecha_hora) = CURDATE() ORDER BY b.id DESC
        ")->getResultArray();
        return $this->json(['ok' => true, 'registros' => $registros]);
    }

    public function registrar(): ResponseInterface
    {
        $data = $this->request->getJSON(true);
        $data['registrado_por'] = session()->get('user_id');
        \Config\Database::connect()->table('bitacora_porteria')->insert($data);
        return $this->json(['ok' => true], 201);
    }
}
