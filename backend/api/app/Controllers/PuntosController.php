<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class PuntosController extends BaseController
{
    private function json(array $data): ResponseInterface
    {
        $origin = $this->request->getHeaderLine('Origin') ?: 'http://127.0.0.1:5500';
        return $this->response
            ->setHeader('Access-Control-Allow-Origin', $origin)
            ->setHeader('Access-Control-Allow-Credentials', 'true')
            ->setJSON($data);
    }

    public function ranking(): ResponseInterface
    {
        $periodo = $this->request->getGet('periodo') ?? 'semana';
        $db = \Config\Database::connect();
        
        $where = ($periodo === 'semana') ? "WHERE p.semana = " . date('W') : "";

        $ranking = $db->query("
            SELECT o.id, o.nombre_completo AS nombre, o.numero_operador, SUM(p.puntos_ganados) AS puntos
            FROM operadores o
            LEFT JOIN puntos_operador p ON p.operador_id = o.id {$where}
            GROUP BY o.id ORDER BY puntos DESC
        ")->getResultArray();

        return $this->json(['ok' => true, 'ranking' => $ranking]);
    }

    public function scorecardMe(): ResponseInterface
    {
        $userId = session()->get('user_id');
        $db = \Config\Database::connect();
        $op = $db->table('operadores')->where('usuario_id', $userId)->get()->getRowArray();
        if (!$op) return $this->json(['ok' => false]);

        $stats = $db->query("
            SELECT SUM(puntos_ganados) AS puntos_semana, SUM(tipo_evento = 'viaje_cargado') AS viajes_cargados
            FROM puntos_operador WHERE operador_id = ? AND semana = ?
        ", [$op['id'], date('W')])->getRowArray();

        return $this->json(['ok' => true, 'puntos_semana' => (int)($stats['puntos_semana'] ?? 0)]);
    }
}
