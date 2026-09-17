<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class CajaController extends BaseController
{
    private function db() { return \Config\Database::connect(); }

    private function json(array $data, int $code = 200): ResponseInterface
    {
        $origin = $this->request->getHeaderLine('Origin') ?: 'http://localhost';
        return $this->response
            ->setHeader('Access-Control-Allow-Origin', $origin)
            ->setHeader('Access-Control-Allow-Credentials', 'true')
            ->setStatusCode($code)->setJSON($data);
    }

    public function index(): ResponseInterface
    {
        $cajas = $this->db()->query("
            SELECT c.*, cl.razon_social AS cliente_nombre
            FROM cajas c
            LEFT JOIN clientes cl ON cl.id = c.cliente_asignado_id
            WHERE c.activo = 1
            ORDER BY c.numero_caja
        ")->getResultArray();

        return $this->json(['ok' => true, 'cajas' => $cajas]);
    }

    public function show(int $id): ResponseInterface
    {
        $caja = $this->db()->query("
            SELECT c.*, cl.razon_social AS cliente_nombre
            FROM cajas c
            LEFT JOIN clientes cl ON cl.id = c.cliente_asignado_id
            WHERE c.id = ?
        ", [$id])->getRowArray();

        if (!$caja) return $this->json(['ok' => false], 404);
        return $this->json(['ok' => true, 'caja' => $caja]);
    }

    public function create(): ResponseInterface
    {
        try {
            $raw = $this->request->getJSON(true) ?? [];
            $data = $raw;

            if (isset($raw['numeroCaja'])) $data['numero_caja'] = $raw['numeroCaja'];
            if (isset($raw['numero_caja'])) $data['numero_caja'] = $raw['numero_caja'];
            if (isset($raw['placas'])) $data['placas_mx'] = $raw['placas'];
            if (isset($raw['placas_mx'])) $data['placas_mx'] = $raw['placas_mx'];

            $required = ['numero_caja', 'tipo', 'placas_mx'];
            foreach ($required as $f) {
                if (empty($data[$f])) {
                    return $this->json(['ok' => false, 'error' => "El campo $f es requerido."], 422);
                }
            }

            // Verificar que el número de caja no exista
            $numCaja = strtoupper(trim($data['numero_caja']));
            $existe = $this->db()->table('cajas')->where('numero_caja', $numCaja)->countAllResults();
            if ($existe > 0) {
                return $this->json(['ok' => false, 'error' => 'El número de caja ya existe. (Registro Duplicado)'], 409);
            }

            $insert = [
                'numero_caja'  => $numCaja,
                'tipo'         => $data['tipo'],
                'placas_mx'    => strtoupper(trim($data['placas_mx'])),
                'placas_usa'   => !empty($data['placas_usa']) ? strtoupper(trim($data['placas_usa'])) : null,
                'estatus'      => !empty($data['estatus']) ? $data['estatus'] : 'disponible',
                'activo'       => isset($data['activo']) ? ($data['activo'] ? 1 : 0) : 1,
                'created_at'   => date('Y-m-d H:i:s'),
                'updated_at'   => date('Y-m-d H:i:s')
            ];

            $this->db()->table('cajas')->insert($insert);
            $id = (int)$this->db()->insertID();
            return $this->json(['ok' => true, 'id' => $id, 'data' => array_merge(['id' => $id], $insert)], 201);
        } catch (\Throwable $e) {
            log_message('error', 'Error en CajaController::create: ' . $e->getMessage());
            return $this->json(['ok' => false, 'error' => 'Error al crear caja: ' . $e->getMessage()], 500);
        }
    }

    public function update(int $id): \CodeIgniter\HTTP\ResponseInterface
    {
        try {
            $raw = $this->request->getJSON(true) ?? [];
            $data = ['updated_at' => date('Y-m-d H:i:s')];
            if (isset($raw['numeroCaja'])) $data['numero_caja'] = strtoupper(trim($raw['numeroCaja']));
            if (isset($raw['numero_caja'])) $data['numero_caja'] = strtoupper(trim($raw['numero_caja']));
            if (isset($raw['tipo'])) $data['tipo'] = $raw['tipo'];
            if (isset($raw['placas'])) $data['placas_mx'] = strtoupper(trim($raw['placas']));
            if (isset($raw['placas_mx'])) $data['placas_mx'] = strtoupper(trim($raw['placas_mx']));
            if (isset($raw['placas_usa'])) $data['placas_usa'] = strtoupper(trim($raw['placas_usa']));
            if (isset($raw['estatus'])) $data['estatus'] = $raw['estatus'];
            if (isset($raw['ubicacion_actual'])) $data['ubicacion_actual'] = trim($raw['ubicacion_actual']);
            if (isset($raw['activo'])) $data['activo'] = $raw['activo'] ? 1 : 0;
            
            $db = $this->db();
            if (!empty($data)) {
                $db->table('cajas')->where('id', $id)->update($data);
            }
            $updated = $db->table('cajas')->where('id', $id)->get()->getRowArray();
            return $this->json(['ok' => true, 'data' => $updated ?: array_merge(['id' => $id], $data)]);
        } catch (\Throwable $e) {
            log_message('error', 'Error en CajaController::update: ' . $e->getMessage());
            return $this->json(['ok' => false, 'error' => 'Error al actualizar caja: ' . $e->getMessage()], 500);
        }
    }

    public function asignar(int $id): ResponseInterface
    {
        $data      = $this->request->getJSON(true);
        $clienteId = $data['cliente_id'] ?? null;
        $db        = $this->db();

        $caja = $db->table('cajas')->where('id', $id)->get()->getRowArray();
        if (!$caja) return $this->json(['ok' => false], 404);

        if ($clienteId) {
            $db->table('cajas')->where('id', $id)->update([
                'cliente_asignado_id' => $clienteId,
                'estatus'             => 'en_cliente',
            ]);
        } else {
            $db->table('cajas')->where('id', $id)->update([
                'cliente_asignado_id' => null,
                'estatus'             => 'disponible',
            ]);
        }

        return $this->json(['ok' => true]);
    }

    public function delete(int $id): \CodeIgniter\HTTP\ResponseInterface
    {
        try {
            \Config\Database::connect()->table('cajas')->where('id', $id)->delete();
            return $this->json(['ok' => true]);
        } catch (\Exception $e) {
            return $this->json(['ok' => false, 'error' => 'No se puede eliminar porque esta asignado a otras tablas.'], 409);
        }
    }
}