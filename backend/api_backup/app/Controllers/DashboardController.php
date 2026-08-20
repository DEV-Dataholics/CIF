<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

/**
 * CIF — DashboardController
 * Endpoint: GET /api/dashboard/resumen
 * Devuelve los datos que alimentan el Pizarrón Digital.
 * Polling cada 30 segundos desde el frontend.
 */
class DashboardController extends BaseController
{
    private function json(array $data): ResponseInterface
    {
        $origin = $this->request->getHeaderLine('Origin') ?: 'http://127.0.0.1:5500';
        return $this->response
            ->setHeader('Access-Control-Allow-Origin', $origin)
            ->setHeader('Access-Control-Allow-Credentials', 'true')
            ->setJSON($data);
    }

    public function resumen(): ResponseInterface
    {
        $db = \Config\Database::connect();

        // ── KPI Flota ────────────────────────────────────────
        $flota = $db->query("
            SELECT
                SUM(estatus = 'en_ruta')     AS en_ruta,
                SUM(estatus = 'en_taller')   AS en_taller,
                SUM(estatus = 'disponible')  AS disponibles,
                SUM(estatus = 'fuera_base')  AS fuera_base,
                COUNT(*)                     AS total
            FROM tractocamiones
        ")->getRowArray();

        // ── KPI Cajas ─────────────────────────────────────────
        $cajasStat = $db->query("
            SELECT SUM(estatus = 'disponible') AS cajas_disponibles FROM cajas
        ")->getRowArray();

        // ── Viajes activos (no facturados, no documentados) ───
        $viajesActivos = $db->query("
            SELECT COUNT(*) AS total
            FROM viajes
            WHERE estatus NOT IN ('facturado','documentado')
        ")->getRowArray();

        // ── Lista de viajes en curso ──────────────────────────
        $listaViajes = $db->query("
            SELECT
                v.id,
                CONCAT(o.nombre_completo) AS operador,
                t.numero_economico        AS economico,
                v.tipo_movimiento,
                v.origen,
                v.destino,
                v.estatus,
                v.fecha_salida
            FROM viajes v
            LEFT JOIN operadores o ON o.id = v.operador_id
            LEFT JOIN tractocamiones t ON t.id = v.tractocamion_id
            WHERE v.estatus IN ('asignado','en_transito','en_aduana')
            ORDER BY v.updated_at DESC
            LIMIT 20
        ")->getResultArray();

        // ── Tractos en taller ─────────────────────────────────
        $tractosTaller = $db->query("
            SELECT
                t.id,
                t.numero_economico,
                t.marca,
                t.modelo,
                ot.descripcion AS orden_activa
            FROM tractocamiones t
            LEFT JOIN ordenes_servicio_taller ot
                ON ot.tractocamion_id = t.id AND ot.estatus = 'en_proceso'
            WHERE t.estatus = 'en_taller'
        ")->getResultArray();

        // ── SOS pendientes ────────────────────────────────────
        $sosPendientes = $db->query("
            SELECT
                s.id,
                t.numero_economico AS economico,
                o.nombre_completo  AS operador,
                s.problema,
                s.urgencia
            FROM solicitudes_taller s
            JOIN tractocamiones t ON t.id = s.tractocamion_id
            JOIN operadores o ON o.id = s.operador_id
            WHERE s.estatus = 'pendiente' AND s.urgencia IN ('sos','alta')
            ORDER BY s.created_at DESC
            LIMIT 5
        ")->getResultArray();

        // ── Solicitudes de taller pendientes ──────────────────
        $tallerPendientes = $db->query("
            SELECT COUNT(*) AS total FROM solicitudes_taller WHERE estatus = 'pendiente'
        ")->getRowArray();

        // ── Costo estimado de inactividad ─────────────────────
        // Estimación simple: tractos_en_taller × $4,500 MXN/día costo oportunidad
        $costoInactividad = (int)($flota['en_taller'] ?? 0) * 4500;

        return $this->json([
            'ok'     => true,
            'resumen' => [
                'en_ruta'                      => (int)($flota['en_ruta'] ?? 0),
                'en_taller'                    => (int)($flota['en_taller'] ?? 0),
                'disponibles'                  => (int)($flota['disponibles'] ?? 0),
                'fuera_base'                   => (int)($flota['fuera_base'] ?? 0),
                'total_flota'                  => (int)($flota['total'] ?? 0),
                'cajas_disponibles'            => (int)($cajasStat['cajas_disponibles'] ?? 0),
                'viajes_activos'               => (int)($viajesActivos['total'] ?? 0),
                'solicitudes_taller_pendientes'=> (int)($tallerPendientes['total'] ?? 0),
                'costo_inactividad'            => $costoInactividad,
            ],
            'viajes_activos'  => $listaViajes,
            'tractos_taller'  => $tractosTaller,
            'sos_pendientes'  => $sosPendientes,
            'timestamp'       => date('Y-m-d H:i:s'),
        ]);
    }
}
