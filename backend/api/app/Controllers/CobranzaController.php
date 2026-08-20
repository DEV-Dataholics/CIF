<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class CobranzaController extends BaseController
{
    private function db()
    {
        return \Config\Database::connect();
    }

    private function json(array $data, int $code = 200): ResponseInterface
    {
        $origin = $this->request->getHeaderLine('Origin') ?: 'http://localhost';
        return $this->response
            ->setHeader('Access-Control-Allow-Origin', $origin)
            ->setHeader('Access-Control-Allow-Credentials', 'true')
            ->setStatusCode($code)
            ->setJSON($data);
    }

    // GET /cobranza
    public function index(): ResponseInterface
    {
        $db = $this->db();
        if (!$db->tableExists('cobranza_facturas')) {
            return $this->json(['ok' => true, 'facturas' => []]);
        }

        $rows = $db->table('cobranza_facturas')
            ->select('id, folio, uuid, cliente, concepto, monto, subtotal, moneda, forma_pago, metodo_pago, rfc_emisor, rfc_receptor, nombre_emisor, fecha_emision, fecha_vencimiento, fecha_pago, estatus, notas')
            ->orderBy('estatus = "pendiente"', 'DESC', false)
            ->orderBy('fecha_emision', 'DESC')
            ->get()
            ->getResultArray();

        $hoy = new \DateTimeImmutable('today');
        foreach ($rows as &$row) {
            $baseFecha = !empty($row['fecha_vencimiento']) ? $row['fecha_vencimiento'] : ($row['fecha_emision'] ?? null);
            $dias = 0;
            if ($baseFecha) {
                try {
                    $venc = new \DateTimeImmutable($baseFecha);
                    $dias = max(0, (int)$venc->diff($hoy)->format('%r%a'));
                } catch (\Throwable $e) {
                    $dias = 0;
                }
            }
            $row['monto'] = (float)($row['monto'] ?? 0);
            $row['subtotal'] = (float)($row['subtotal'] ?? 0);
            $row['dias_antiguedad'] = $dias;
        }
        unset($row);

        return $this->json(['ok' => true, 'facturas' => $rows]);
    }

    // POST /cobranza
    public function create(): ResponseInterface
    {
        $db = $this->db();
        if (!$db->tableExists('cobranza_facturas')) {
            return $this->json(['ok' => false, 'error' => 'Tabla cobranza_facturas no existe. Ejecuta migraciones.'], 500);
        }

        $data = $this->request->getJSON(true) ?? [];

        $folio = trim((string)($data['folio'] ?? ''));
        $cliente = trim((string)($data['cliente'] ?? ''));
        $fechaEmision = trim((string)($data['fecha_emision'] ?? ''));

        if ($folio === '' || $cliente === '' || $fechaEmision === '') {
            return $this->json(['ok' => false, 'error' => 'folio, cliente y fecha_emision son requeridos.'], 422);
        }

        $uuid = trim((string)($data['uuid'] ?? ''));
        if ($uuid !== '') {
            $existsUuid = $db->table('cobranza_facturas')->where('uuid', $uuid)->countAllResults();
            if ($existsUuid > 0) {
                return $this->json(['ok' => false, 'error' => 'Ya existe una factura con ese UUID.'], 409);
            }
        }

        $existsFolio = $db->table('cobranza_facturas')->where('folio', $folio)->countAllResults();
        if ($existsFolio > 0) {
            return $this->json(['ok' => false, 'error' => 'Ya existe una factura con ese folio.'], 409);
        }

        $fechaVencimiento = trim((string)($data['fecha_vencimiento'] ?? ''));
        if ($fechaVencimiento === '') {
            try {
                $base = new \DateTimeImmutable($fechaEmision);
                $fechaVencimiento = $base->modify('+30 days')->format('Y-m-d');
            } catch (\Throwable $e) {
                $fechaVencimiento = null;
            }
        }

        $insert = [
            'folio' => $folio,
            'uuid' => $uuid !== '' ? $uuid : null,
            'cliente' => $cliente,
            'concepto' => trim((string)($data['concepto'] ?? '')),
            'monto' => (float)($data['monto'] ?? 0),
            'subtotal' => (float)($data['subtotal'] ?? 0),
            'moneda' => trim((string)($data['moneda'] ?? 'MXN')) ?: 'MXN',
            'forma_pago' => trim((string)($data['forma_pago'] ?? '')) ?: null,
            'metodo_pago' => trim((string)($data['metodo_pago'] ?? '')) ?: null,
            'rfc_emisor' => trim((string)($data['rfc_emisor'] ?? '')) ?: null,
            'rfc_receptor' => trim((string)($data['rfc_receptor'] ?? '')) ?: null,
            'nombre_emisor' => trim((string)($data['nombre_emisor'] ?? '')) ?: null,
            'fecha_emision' => $fechaEmision,
            'fecha_vencimiento' => $fechaVencimiento,
            'estatus' => 'pendiente',
            'notas' => trim((string)($data['notas'] ?? '')) ?: null,
            'created_by' => session()->get('user_id') ?: null,
        ];

        $db->table('cobranza_facturas')->insert($insert);
        $id = (int)$db->insertID();

        return $this->json(['ok' => true, 'id' => $id], 201);
    }

    // PUT /cobranza/:id/pagar
    public function pagar(int $id): ResponseInterface
    {
        $db = $this->db();
        if (!$db->tableExists('cobranza_facturas')) {
            return $this->json(['ok' => false, 'error' => 'Tabla cobranza_facturas no existe. Ejecuta migraciones.'], 500);
        }

        $factura = $db->table('cobranza_facturas')->where('id', $id)->get()->getRowArray();
        if (!$factura) {
            return $this->json(['ok' => false, 'error' => 'Factura no encontrada.'], 404);
        }

        $data = $this->request->getJSON(true) ?? [];
        $fechaPago = trim((string)($data['fecha_pago'] ?? ''));
        if ($fechaPago === '') {
            $fechaPago = date('Y-m-d');
        }

        $db->table('cobranza_facturas')->where('id', $id)->update([
            'estatus' => 'pagada',
            'fecha_pago' => $fechaPago,
            'notas' => trim((string)($data['notas'] ?? $factura['notas'] ?? '')) ?: null,
        ]);

        return $this->json(['ok' => true, 'id' => $id, 'estatus' => 'pagada']);
    }
}
