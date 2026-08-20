<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

/** CIF — PuntosController — Ranking y scorecard de gamificación */
class PuntosController extends BaseController
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

    /** GET /api/gamificacion/ranking?periodo=semana|mes|todo */
    public function ranking(): ResponseInterface
    {
        $periodo = $this->request->getGet('periodo') ?? 'semana';
        $db      = $this->db();
        $where   = '';

        if ($periodo === 'semana') {
            $semana = (int)date('W');
            $anio   = (int)date('Y');
            $where  = "WHERE p.semana = {$semana} AND p.anio = {$anio}";
        } elseif ($periodo === 'mes') {
            $mes  = (int)date('m');
            $anio = (int)date('Y');
            $where = "WHERE MONTH(p.fecha_registro) = {$mes} AND YEAR(p.fecha_registro) = {$anio}";
        }

        $ranking = $db->query("
            SELECT
                o.id AS operador_id,
                o.nombre_completo AS nombre,
                o.numero_operador,
                COALESCE(SUM(p.puntos_ganados), 0) AS puntos,
                COALESCE(SUM(p.tipo_evento = 'viaje_cargado'), 0) AS viajes_cargados,
                COALESCE(SUM(p.tipo_evento IN ('viaje_vacio','rampa')), 0) AS viajes_vacios
            FROM operadores o
            LEFT JOIN puntos_operador p ON p.operador_id = o.id {$where}
            WHERE o.activo = 1
            GROUP BY o.id, o.nombre_completo, o.numero_operador
            ORDER BY puntos DESC, viajes_cargados DESC
        ")->getResultArray();

        $totales = $db->query("
            SELECT
                COUNT(DISTINCT viaje_id) AS total_viajes,
                SUM(puntos_ganados) AS total_puntos
            FROM puntos_operador p
            {$where}
        ")->getRowArray();

        return $this->json([
            'ok'      => true,
            'ranking' => $ranking,
            'totales' => $totales,
            'periodo' => $periodo,
        ]);
    }

    /** GET /api/gamificacion/scorecard/me */
    public function scorecardMe(): ResponseInterface
    {
        $userId = session()->get('user_id');
        $op     = $this->db()->table('operadores')->where('usuario_id', $userId)->get()->getRowArray();
        if (!$op) return $this->json(['ok' => false, 'error' => 'No eres operador'], 403);
        return $this->scorecard($op['id']);
    }

    /** GET /api/gamificacion/scorecard/{id} */
    public function scorecard(int $opId): ResponseInterface
    {
        $db     = $this->db();
        $semana = (int)date('W');
        $anio   = (int)date('Y');

        $stats = $db->query("
            SELECT
                SUM(puntos_ganados) AS puntos_semana,
                SUM(tipo_evento = 'viaje_cargado') AS viajes_cargados,
                SUM(tipo_evento IN ('viaje_vacio','rampa')) AS viajes_vacios
            FROM puntos_operador
            WHERE operador_id = ? AND semana = ? AND anio = ?
        ", [$opId, $semana, $anio])->getRowArray();

        // Calcular posición en el ranking
        $posicion = $db->query("
            SELECT COUNT(*) + 1 AS pos FROM (
                SELECT operador_id, SUM(puntos_ganados) AS pts
                FROM puntos_operador
                WHERE semana = ? AND anio = ?
                GROUP BY operador_id
                HAVING pts > ?
            ) sub
        ", [$semana, $anio, $stats['puntos_semana'] ?? 0])->getRowArray();

        return $this->json([
            'ok'              => true,
            'puntos_semana'   => (int)($stats['puntos_semana']   ?? 0),
            'viajes_cargados' => (int)($stats['viajes_cargados'] ?? 0),
            'viajes_vacios'   => (int)($stats['viajes_vacios']   ?? 0),
            'posicion'        => (int)($posicion['pos']          ?? 1),
        ]);
    }
}
