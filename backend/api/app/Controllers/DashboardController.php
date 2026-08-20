<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class DashboardController extends BaseController
{
    private function db() { return \Config\Database::connect(); }

    private function json(array $data): ResponseInterface
    {
        $origin = $this->request->getHeaderLine('Origin') ?: 'http://localhost';
        return $this->response
            ->setHeader('Access-Control-Allow-Origin', $origin)
            ->setHeader('Access-Control-Allow-Credentials', 'true')
            ->setJSON($data);
    }

    public function resumen(): ResponseInterface
    {
        $db = $this->db();

        // ── 1. KPIs de flota ──────────────────────────────
        $flota = $db->query("
            SELECT
                SUM(estatus = 'en_ruta')    AS en_ruta,
                SUM(estatus = 'en_taller')  AS en_taller,
                SUM(estatus = 'disponible') AS disponibles,
                COUNT(*)                    AS total
            FROM tractocamiones
        ")->getRowArray();

        // ── 2. Cajas disponibles ──────────────────────────
        $cajasStat = $db->query(
            "SELECT SUM(estatus = 'disponible') AS disponibles FROM cajas"
        )->getRowArray();

        // ── 3. Viajes activos (conteo) ────────────────────
        $viajesActivos = $db->table('viajes')
            ->whereNotIn('estatus', ['facturado','documentado'])
            ->countAllResults();

        // ── 4. Solicitudes taller pendientes ─────────────
        $solicitudesPendientes = $db->table('solicitudes_taller')
            ->whereIn('estatus', ['pendiente','en_proceso'])
            ->countAllResults();

        // ── 5. Costo de inactividad ($1,500/día por tracto en taller) ──
        $tractosTaller = (int)($flota['en_taller'] ?? 0);
        $costoInactividad = $tractosTaller * 1500;

        // ── 6. Lista de viajes activos (para la tabla del dashboard) ──
        $listaViajes = $db->query("
            SELECT
                v.id, v.tipo_movimiento, v.origen, v.destino, v.estatus,
                o.nombre_completo AS operador,
                t.numero_economico AS economico
            FROM viajes v
            LEFT JOIN operadores o ON o.id = v.operador_id
            LEFT JOIN tractocamiones t ON t.id = v.tractocamion_id
            WHERE v.estatus IN ('solicitado','asignado','en_transito','en_aduana')
            ORDER BY v.updated_at DESC
            LIMIT 15
        ")->getResultArray();

        // ── 7. Tractos en taller (con orden activa) ───────
        $tractosTallerLista = $db->query("
            SELECT
                t.id, t.numero_economico, t.marca, t.modelo,
                (
                  SELECT o.descripcion
                  FROM ordenes_servicio_taller o
                  WHERE o.tractocamion_id = t.id
                    AND o.estatus IN ('abierta','en_proceso')
                  ORDER BY o.id DESC LIMIT 1
                ) AS orden_activa
            FROM tractocamiones t
            WHERE t.estatus = 'en_taller'
            ORDER BY t.numero_economico
        ")->getResultArray();

        // ── 8. Alertas SOS pendientes ─────────────────────
        $sosPendientes = $db->query("
            SELECT
                s.id, s.problema, s.urgencia, s.estatus,
                t.numero_economico AS economico,
                o.nombre_completo  AS operador
            FROM solicitudes_taller s
            JOIN tractocamiones t ON t.id = s.tractocamion_id
            JOIN operadores o     ON o.id = s.operador_id
            WHERE s.urgencia = 'sos' AND s.estatus IN ('pendiente','en_proceso')
            ORDER BY s.id DESC
            LIMIT 5
        ")->getResultArray();

        return $this->json([
            'ok' => true,
            'resumen' => [
                'en_ruta'                     => (int)($flota['en_ruta']     ?? 0),
                'en_taller'                   => (int)($flota['en_taller']   ?? 0),
                'disponibles'                 => (int)($flota['disponibles'] ?? 0),
                'cajas_disponibles'           => (int)($cajasStat['disponibles'] ?? 0),
                'viajes_activos'              => $viajesActivos,
                'solicitudes_taller_pendientes' => $solicitudesPendientes,
                'costo_inactividad'           => $costoInactividad,
            ],
            'viajes_activos'  => $listaViajes,
            'tractos_taller'  => $tractosTallerLista,
            'sos_pendientes'  => $sosPendientes,
            'timestamp'       => date('Y-m-d H:i:s'),
        ]);
    }
}
