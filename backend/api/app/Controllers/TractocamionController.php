<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class TractocamionController extends BaseController
{
    private function json(array $data, int $code = 200): ResponseInterface
    {
        $origin = $this->request->getHeaderLine('Origin') ?: 'http://127.0.0.1:5500';
        return $this->response
            ->setHeader('Access-Control-Allow-Origin', $origin)
            ->setHeader('Access-Control-Allow-Credentials', 'true')
            ->setStatusCode($code)->setJSON($data);
    }

    public function index(): ResponseInterface
    {
        $db = \Config\Database::connect();
        $tractos = $db->query("
            SELECT t.*, o.nombre_completo AS operador_nombre
            FROM tractocamiones t
            LEFT JOIN operadores o ON o.id = t.operador_asignado_id
            ORDER BY t.numero_economico ASC
        ")->getResultArray();
        return $this->json(['ok' => true, 'tractos' => $tractos]);
    }

    public function show(int $id): ResponseInterface
    {
        $tracto = \Config\Database::connect()->table('tractocamiones')->where('id', $id)->get()->getRowArray();
        if (!$tracto) return $this->json(['ok' => false], 404);
        return $this->json(['ok' => true, 'tracto' => $tracto]);
    }

    private function sanitizeDate($val): ?string
    {
        if ($val === null) return null;
        $val = trim((string)$val);
        if ($val === '' || $val === '0000-00-00') return null;
        $ts = strtotime($val);
        return $ts ? date('Y-m-d', $ts) : null;
    }

    public function create(): ResponseInterface
    {
        try {
            $raw = $this->request->getJSON(true) ?? [];
            $data = [];
            if (isset($raw['numeroEconomico'])) $data['numero_economico'] = strtoupper(trim($raw['numeroEconomico']));
            if (isset($raw['numero_economico'])) $data['numero_economico'] = strtoupper(trim($raw['numero_economico']));
            if (isset($raw['placas'])) $data['placas_mx'] = strtoupper(trim($raw['placas']));
            if (isset($raw['placas_mx'])) $data['placas_mx'] = strtoupper(trim($raw['placas_mx']));
            if (isset($raw['placas_usa'])) $data['placas_usa'] = strtoupper(trim($raw['placas_usa']));
            if (isset($raw['marca'])) $data['marca'] = trim($raw['marca']);
            if (isset($raw['modelo'])) $data['modelo'] = trim($raw['modelo']);
            if (isset($raw['anio'])) $data['anio'] = !empty($raw['anio']) ? (int)$raw['anio'] : null;
            if (isset($raw['estatus'])) $data['estatus'] = $raw['estatus'];
            if (isset($raw['activo'])) $data['activo'] = $raw['activo'] ? 1 : 0;
            if (isset($raw['permiso_sct'])) $data['permiso_sct'] = trim($raw['permiso_sct']);
            if (isset($raw['poliza_mx'])) $data['poliza_mx'] = trim($raw['poliza_mx']);
            if (isset($raw['poliza_usa'])) $data['poliza_usa'] = trim($raw['poliza_usa']);

            // Parse date fields from both camelCase and snake_case
            $sct = $raw['vencimiento_sct'] ?? $raw['vigenciaSCT'] ?? null;
            if ($sct !== null) $data['vencimiento_sct'] = $this->sanitizeDate($sct);

            $seguroMx = $raw['vencimiento_poliza_mx'] ?? $raw['vigenciaSeguro'] ?? $raw['vigenciaPolizaMx'] ?? null;
            if ($seguroMx !== null) $data['vencimiento_poliza_mx'] = $this->sanitizeDate($seguroMx);

            $seguroUsa = $raw['vencimiento_poliza_usa'] ?? $raw['vigenciaPolizaUsa'] ?? null;
            if ($seguroUsa !== null) $data['vencimiento_poliza_usa'] = $this->sanitizeDate($seguroUsa);

            if (empty($data['numero_economico'])) {
                return $this->json(['ok' => false, 'error' => 'El número económico es requerido.'], 422);
            }

            $db = \Config\Database::connect();
            $existe = $db->table('tractocamiones')->where('numero_economico', $data['numero_economico'])->countAllResults();
            if ($existe > 0) {
                return $this->json(['ok' => false, 'error' => 'El número económico ya existe. (Registro Duplicado)'], 409);
            }

            $data['created_at'] = date('Y-m-d H:i:s');
            $data['updated_at'] = date('Y-m-d H:i:s');

            $db->table('tractocamiones')->insert($data);
            $id = (int)$db->insertID();

            $created = $db->table('tractocamiones')->where('id', $id)->get()->getRowArray();
            return $this->json(['ok' => true, 'id' => $id, 'data' => $created ?: array_merge(['id' => $id], $data)], 201);
        } catch (\Throwable $e) {
            log_message('error', 'Error en TractocamionController::create: ' . $e->getMessage());
            return $this->json(['ok' => false, 'error' => 'Error al crear tractocamión: ' . $e->getMessage()], 500);
        }
    }

    public function update(int $id): \CodeIgniter\HTTP\ResponseInterface
    {
        try {
            $raw = $this->request->getJSON(true) ?? [];
            $data = ['updated_at' => date('Y-m-d H:i:s')];
            if (isset($raw['numeroEconomico'])) $data['numero_economico'] = strtoupper(trim($raw['numeroEconomico']));
            if (isset($raw['numero_economico'])) $data['numero_economico'] = strtoupper(trim($raw['numero_economico']));
            if (isset($raw['placas'])) $data['placas_mx'] = strtoupper(trim($raw['placas']));
            if (isset($raw['placas_mx'])) $data['placas_mx'] = strtoupper(trim($raw['placas_mx']));
            if (isset($raw['placas_usa'])) $data['placas_usa'] = strtoupper(trim($raw['placas_usa']));
            if (isset($raw['marca'])) $data['marca'] = trim($raw['marca']);
            if (isset($raw['modelo'])) $data['modelo'] = trim($raw['modelo']);
            if (isset($raw['anio'])) $data['anio'] = !empty($raw['anio']) ? (int)$raw['anio'] : null;
            if (isset($raw['estatus'])) $data['estatus'] = $raw['estatus'];
            if (isset($raw['activo'])) $data['activo'] = $raw['activo'] ? 1 : 0;
            if (isset($raw['permiso_sct'])) $data['permiso_sct'] = trim($raw['permiso_sct']);
            if (isset($raw['poliza_mx'])) $data['poliza_mx'] = trim($raw['poliza_mx']);
            if (isset($raw['poliza_usa'])) $data['poliza_usa'] = trim($raw['poliza_usa']);

            $sct = $raw['vencimiento_sct'] ?? $raw['vigenciaSCT'] ?? null;
            if ($sct !== null) $data['vencimiento_sct'] = $this->sanitizeDate($sct);

            $seguroMx = $raw['vencimiento_poliza_mx'] ?? $raw['vigenciaSeguro'] ?? $raw['vigenciaPolizaMx'] ?? null;
            if ($seguroMx !== null) $data['vencimiento_poliza_mx'] = $this->sanitizeDate($seguroMx);

            $seguroUsa = $raw['vencimiento_poliza_usa'] ?? $raw['vigenciaPolizaUsa'] ?? null;
            if ($seguroUsa !== null) $data['vencimiento_poliza_usa'] = $this->sanitizeDate($seguroUsa);

            $db = \Config\Database::connect();
            if (!empty($data)) {
                $db->table('tractocamiones')->where('id', $id)->update($data);
            }
            $updated = $db->table('tractocamiones')->where('id', $id)->get()->getRowArray();
            return $this->json(['ok' => true, 'data' => $updated ?: array_merge(['id' => $id], $data)]);
        } catch (\Throwable $e) {
            log_message('error', 'Error en TractocamionController::update: ' . $e->getMessage());
            return $this->json(['ok' => false, 'error' => 'Error al actualizar tractocamión: ' . $e->getMessage()], 500);
        }
    }

    public function delete(int $id): ResponseInterface
    {
        try {
            \Config\Database::connect()->table('tractocamiones')->where('id', $id)->delete();
            return $this->json(['ok' => true]);
        } catch (\Exception $e) {
            // Foreign key constraints can fail the deletion. We catch it.
            return $this->json(['ok' => false, 'error' => 'No se puede eliminar el tractocamión porque está asignado a otras tablas.'], 409);
        }
    }
}
