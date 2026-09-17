<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class TiposMovimientoController extends BaseController
{
    private function db()
    {
        return \Config\Database::connect();
    }

    private function getTableName(): string
    {
        try {
            $db = $this->db();
            if ($db->tableExists('tiposMovimiento')) {
                return 'tiposMovimiento';
            }
            if ($db->tableExists('tiposmovimiento')) {
                return 'tiposmovimiento';
            }
        } catch (\Throwable $e) {
            // fallback
        }
        return 'tiposMovimiento';
    }

    private function json(array $data, int $code = 200): ResponseInterface
    {
        $origin = $this->request->getHeaderLine('Origin');
        if (empty($origin)) {
            $origin = '*';
        }
        return $this->response
            ->setHeader('Access-Control-Allow-Origin', $origin)
            ->setHeader('Access-Control-Allow-Credentials', 'true')
            ->setStatusCode($code)
            ->setJSON($data);
    }

    public function index(): ResponseInterface
    {
        try {
            $table = $this->getTableName();
            $items = $this->db()->table($table)->orderBy('id', 'ASC')->get()->getResultArray();
            return $this->json($items ?: []);
        } catch (\Throwable $e) {
            log_message('error', 'Error en TiposMovimientoController::index: ' . $e->getMessage());
            return $this->json([]);
        }
    }

    public function create(): ResponseInterface
    {
        try {
            $raw = $this->request->getJSON(true) ?? [];
            $data = [
                'nombre'          => trim($raw['nombre'] ?? ''),
                'clienteAsociado' => $raw['clienteAsociado'] ?? 'NA',
                'created_at'      => date('Y-m-d H:i:s'),
                'updated_at'      => date('Y-m-d H:i:s'),
            ];

            if (empty($data['nombre'])) {
                return $this->json(['ok' => false, 'error' => 'El nombre del tipo de movimiento es requerido.'], 422);
            }

            $table = $this->getTableName();
            $this->db()->table($table)->insert($data);
            $insertId = $this->db()->insertID();
            return $this->json(['ok' => true, 'id' => $insertId, 'data' => array_merge(['id' => $insertId], $data)], 201);
        } catch (\Throwable $e) {
            log_message('error', 'Error en TiposMovimientoController::create: ' . $e->getMessage());
            return $this->json(['ok' => false, 'error' => 'Error al crear tipo de movimiento: ' . $e->getMessage()], 500);
        }
    }

    public function update($id = null): ResponseInterface
    {
        try {
            $raw = $this->request->getJSON(true) ?? [];
            $data = ['updated_at' => date('Y-m-d H:i:s')];
            if (isset($raw['nombre'])) $data['nombre'] = trim($raw['nombre']);
            if (isset($raw['clienteAsociado'])) $data['clienteAsociado'] = $raw['clienteAsociado'];

            $table = $this->getTableName();
            $this->db()->table($table)->where('id', $id)->update($data);
            return $this->json(['ok' => true, 'status' => 'updated', 'data' => array_merge(['id' => $id], $data)]);
        } catch (\Throwable $e) {
            log_message('error', 'Error en TiposMovimientoController::update: ' . $e->getMessage());
            return $this->json(['ok' => false, 'error' => 'Error al actualizar tipo de movimiento: ' . $e->getMessage()], 500);
        }
    }

    public function delete($id = null): ResponseInterface
    {
        try {
            $table = $this->getTableName();
            $this->db()->table($table)->where('id', $id)->delete();
            try {
                $this->db()->table('precios')->where('tipo_mov_id', $id)->delete();
            } catch (\Throwable $ignore) {}
            return $this->json(['ok' => true, 'id' => $id]);
        } catch (\Throwable $e) {
            log_message('error', 'Error en TiposMovimientoController::delete: ' . $e->getMessage());
            return $this->json(['ok' => false, 'error' => 'Error al eliminar tipo de movimiento: ' . $e->getMessage()], 500);
        }
    }
}
