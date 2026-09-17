<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class NotificacionesController extends BaseController
{
    private function db()
    {
        return \Config\Database::connect();
    }

    private function json(array $data, int $code = 200): ResponseInterface
    {
        $origin = $this->request->getHeaderLine('Origin') ?: '*';
        return $this->response
            ->setHeader('Access-Control-Allow-Origin', $origin)
            ->setHeader('Access-Control-Allow-Credentials', 'true')
            ->setStatusCode($code)
            ->setJSON($data);
    }

    private function isValidDate($date): bool
    {
        if (empty($date) || $date === '0000-00-00') return false;
        $ts = strtotime($date);
        return $ts !== false && $ts > 946684800; // After year 2000
    }

    public function index(): ResponseInterface
    {
        try {
            $db = $this->db();
            $today = date('Y-m-d');
            $todayTs = strtotime($today);
            $notificaciones = [];

            // 1. Escanear Operadores activos
            try {
                $operadores = $db->table('operadores')
                    ->where('activo', 1)
                    ->get()
                    ->getResultArray();

                foreach ($operadores as $op) {
                    $opNombre = $op['nombre_completo'] ?? ('Operador #' . $op['id']);
                    
                    // Licencia MX
                    if ($this->isValidDate($op['licencia_mx_vencimiento'] ?? null)) {
                        $venc = $op['licencia_mx_vencimiento'];
                        $diff = (int)ceil((strtotime($venc) - $todayTs) / 86400);
                        if ($diff <= 60 && $diff >= -365) {
                            $sev = $diff <= 15 ? 'critico' : ($diff <= 30 ? 'advertencia' : 'informativo');
                            $notificaciones[] = [
                                'id'               => 'op-lic-' . $op['id'],
                                'modulo'           => 'operador',
                                'modulo_id'        => (int)$op['id'],
                                'entidad'          => $opNombre,
                                'documento'        => 'Licencia Federal MX',
                                'fecha_vencimiento'=> $venc,
                                'dias_restantes'   => $diff,
                                'severidad'        => $sev,
                                'link'             => '/admin/operadores'
                            ];
                        }
                    }

                    // Licencia USA / Visa
                    $visaFecha = $op['licencia_usa_vencimiento'] ?? ($op['visa_vencimiento'] ?? null);
                    if ($this->isValidDate($visaFecha)) {
                        $diff = (int)ceil((strtotime($visaFecha) - $todayTs) / 86400);
                        if ($diff <= 60 && $diff >= -365) {
                            $sev = $diff <= 15 ? 'critico' : ($diff <= 30 ? 'advertencia' : 'informativo');
                            $notificaciones[] = [
                                'id'               => 'op-visa-' . $op['id'],
                                'modulo'           => 'operador',
                                'modulo_id'        => (int)$op['id'],
                                'entidad'          => $opNombre,
                                'documento'        => 'Visa / FAST (USA)',
                                'fecha_vencimiento'=> $visaFecha,
                                'dias_restantes'   => $diff,
                                'severidad'        => $sev,
                                'link'             => '/admin/operadores'
                            ];
                        }
                    }
                }
            } catch (\Throwable $eOp) {
                log_message('error', 'Error escaneando operadores para notificaciones: ' . $eOp->getMessage());
            }

            // 2. Escanear Tractocamiones activos
            try {
                $tractos = $db->table('tractocamiones')
                    ->where('activo', 1)
                    ->get()
                    ->getResultArray();

                foreach ($tractos as $tr) {
                    $eco = 'Tracto #' . ($tr['numero_economico'] ?? $tr['id']);

                    // Permiso SCT
                    if ($this->isValidDate($tr['vencimiento_sct'] ?? null)) {
                        $diff = (int)ceil((strtotime($tr['vencimiento_sct']) - $todayTs) / 86400);
                        if ($diff <= 60 && $diff >= -365) {
                            $sev = $diff <= 15 ? 'critico' : ($diff <= 30 ? 'advertencia' : 'informativo');
                            $notificaciones[] = [
                                'id'               => 'tr-sct-' . $tr['id'],
                                'modulo'           => 'tractocamion',
                                'modulo_id'        => (int)$tr['id'],
                                'entidad'          => $eco,
                                'documento'        => 'Permiso SCT',
                                'fecha_vencimiento'=> $tr['vencimiento_sct'],
                                'dias_restantes'   => $diff,
                                'severidad'        => $sev,
                                'link'             => '/admin/unidades'
                            ];
                        }
                    }

                    // Seguro MX
                    if ($this->isValidDate($tr['vencimiento_poliza_mx'] ?? null)) {
                        $diff = (int)ceil((strtotime($tr['vencimiento_poliza_mx']) - $todayTs) / 86400);
                        if ($diff <= 60 && $diff >= -365) {
                            $sev = $diff <= 15 ? 'critico' : ($diff <= 30 ? 'advertencia' : 'informativo');
                            $notificaciones[] = [
                                'id'               => 'tr-segmx-' . $tr['id'],
                                'modulo'           => 'tractocamion',
                                'modulo_id'        => (int)$tr['id'],
                                'entidad'          => $eco,
                                'documento'        => 'Póliza Seguro MX',
                                'fecha_vencimiento'=> $tr['vencimiento_poliza_mx'],
                                'dias_restantes'   => $diff,
                                'severidad'        => $sev,
                                'link'             => '/admin/unidades'
                            ];
                        }
                    }

                    // Seguro USA
                    if ($this->isValidDate($tr['vencimiento_poliza_usa'] ?? null)) {
                        $diff = (int)ceil((strtotime($tr['vencimiento_poliza_usa']) - $todayTs) / 86400);
                        if ($diff <= 60 && $diff >= -365) {
                            $sev = $diff <= 15 ? 'critico' : ($diff <= 30 ? 'advertencia' : 'informativo');
                            $notificaciones[] = [
                                'id'               => 'tr-segusa-' . $tr['id'],
                                'modulo'           => 'tractocamion',
                                'modulo_id'        => (int)$tr['id'],
                                'entidad'          => $eco,
                                'documento'        => 'Póliza Seguro USA',
                                'fecha_vencimiento'=> $tr['vencimiento_poliza_usa'],
                                'dias_restantes'   => $diff,
                                'severidad'        => $sev,
                                'link'             => '/admin/unidades'
                            ];
                        }
                    }
                }
            } catch (\Throwable $eTr) {
                log_message('error', 'Error escaneando tractos para notificaciones: ' . $eTr->getMessage());
            }

            // Ordenar por urgencia (menor cantidad de días restantes primero)
            usort($notificaciones, static function ($a, $b) {
                return $a['dias_restantes'] <=> $b['dias_restantes'];
            });

            $criticasCount = 0;
            foreach ($notificaciones as $n) {
                if ($n['severidad'] === 'critico') {
                    $criticasCount++;
                }
            }

            return $this->json([
                'ok'             => true,
                'total'          => count($notificaciones),
                'criticas'       => $criticasCount,
                'notificaciones' => $notificaciones
            ]);
        } catch (\Throwable $e) {
            log_message('error', 'Error general en NotificacionesController::index: ' . $e->getMessage());
            return $this->json([
                'ok'             => true,
                'total'          => 0,
                'criticas'       => 0,
                'notificaciones' => []
            ]);
        }
    }
}
