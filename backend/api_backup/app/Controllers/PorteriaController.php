<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

/** CIF — PorteriaController — Bitácora de entradas y salidas físicas */
class PorteriaController extends BaseController
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

    /** GET /api/porteria/bitacora — registros del día */
    public function bitacora(): ResponseInterface
    {
        $registros = $this->db()->query("
            SELECT b.*,
                t.numero_economico AS economico,
                c.numero_caja,
                o.nombre_completo AS operador,
                TIME(b.fecha_hora) AS hora
            FROM bitacora_porteria b
            LEFT JOIN tractocamiones t ON t.id = b.tractocamion_id
            LEFT JOIN cajas c ON c.id = b.caja_id
            LEFT JOIN operadores o ON o.id = b.operador_id
            WHERE DATE(b.fecha_hora) = CURDATE()
            ORDER BY b.fecha_hora DESC
        ")->getResultArray();

        return $this->json(['ok' => true, 'registros' => $registros]);
    }

    /** POST /api/porteria/bitacora — registrar entrada o salida */
    public function registrar(): ResponseInterface
    {
        $rol = session()->get('user_rol');
        if (!in_array($rol, ['admin', 'porteria', 'trafico'])) {
            return $this->json(['ok' => false, 'mensaje' => 'Sin permiso'], 403);
        }
        $data = $this->request->getJSON(true);
        $data['registrado_por'] = session()->get('user_id');
        $data['fecha_hora']     = date('Y-m-d H:i:s');

        $id = $this->db()->table('bitacora_porteria')->insert($data, true);
        return $this->json(['ok' => true, 'id' => $id, 'mensaje' => 'Movimiento registrado en portería'], 201);
    }
}
