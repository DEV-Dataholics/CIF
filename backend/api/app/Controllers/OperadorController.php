<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class OperadorController extends BaseController
{
    private function db() { return \Config\Database::connect(); }

    private function json(array $data, int $code = 200): ResponseInterface
    {
        $origin = $this->request->getHeaderLine('Origin');
        if (empty($origin)) {
            $origin = 'http://localhost';
        }
        return $this->response
            ->setHeader('Access-Control-Allow-Origin', $origin)
            ->setHeader('Access-Control-Allow-Credentials', 'true')
            ->setStatusCode($code)->setJSON($data);
    }

    public function index(): ResponseInterface
    {
        $operadores = $this->db()->query("
            SELECT
                op.*,
                GROUP_CONCAT(t.numero_economico SEPARATOR ', ') AS tracto_numero_economico,
                GROUP_CONCAT(t.marca SEPARATOR ', ')            AS tracto_marca,
                GROUP_CONCAT(t.estatus SEPARATOR ', ')          AS tracto_estatus
            FROM operadores op
            LEFT JOIN tractocamiones t ON t.operador_asignado_id = op.id
            GROUP BY op.id
            ORDER BY op.numero_operador
        ")->getResultArray();

        return $this->json(['ok' => true, 'operadores' => $operadores]);
    }

    public function show(int $id): ResponseInterface
    {
        $op = $this->db()->query("
            SELECT op.*, t.numero_economico AS tracto_numero_economico
            FROM operadores op
            LEFT JOIN tractocamiones t ON t.operador_asignado_id = op.id
            WHERE op.id = ?
        ", [$id])->getRowArray();

        if (!$op) return $this->json(['ok' => false], 404);
        return $this->json(['ok' => true, 'operador' => $op]);
    }

    public function create(): ResponseInterface
    {
        $raw = $this->request->getJSON(true);
        $data = $raw;

        // Mapear payload del frontend (camelCase) a base de datos (snake_case)
        if (isset($raw['nombreCompleto'])) $data['nombre_completo'] = $raw['nombreCompleto'];
        if (isset($raw['licencia'])) $data['licencia_mx'] = $raw['licencia'];
        if (isset($raw['visa'])) $data['licencia_usa'] = $raw['visa'];
        if (isset($raw['vigenciaLicencia'])) $data['licencia_mx_vencimiento'] = $raw['vigenciaLicencia'];
        if (isset($raw['vigenciaVisa'])) $data['licencia_usa_vencimiento'] = $raw['vigenciaVisa'];

        $db   = $this->db();

        // Si no mandan numero_operador desde el UI, lo auto-generamos
        if (empty($data['numero_operador'])) {
            $maxNum = $db->query("SELECT MAX(CAST(REPLACE(numero_operador, 'OP-', '') AS UNSIGNED)) AS max_n FROM operadores WHERE numero_operador LIKE 'OP-%'")->getRowArray();
            $siguiente = ($maxNum['max_n'] ?? 0) + 1;
            $data['numero_operador'] = 'OP-' . str_pad($siguiente, 4, '0', STR_PAD_LEFT);
        }

        // Si no mandan licencia_mx, ponemos un temporal para no romper la BD si está en un entorno relajado
        if (empty($data['licencia_mx'])) {
            $data['licencia_mx'] = 'PENDIENTE';
        }

        // Validar requeridos
        $required = ['nombre_completo', 'numero_operador', 'licencia_mx'];
        foreach ($required as $f) {
            if (empty($data[$f])) {
                return $this->json(['ok' => false, 'error' => "El campo $f es requerido."], 422);
            }
        }

        // Número de operador único
        $existe = $db->table('operadores')->where('numero_operador', $data['numero_operador'])->countAllResults();
        if ($existe > 0) {
            return $this->json(['ok' => false, 'error' => 'El número de operador ya existe.'], 409);
        }

        // Crear usuario del sistema para el operador
        $email    = strtolower(str_replace(' ', '.', $data['numero_operador'])) . '@cif.mx';
        $password = password_hash('cif2026', PASSWORD_BCRYPT);

        $usuarioId = $db->table('usuarios')->insert([
            'nombre'   => $data['nombre_completo'],
            'email'    => $email,
            'password' => $password,
            'rol'      => 'operador',
            'activo'   => 1,
        ], true);

        // Insertar operador
        $insert = [
            'usuario_id'              => $usuarioId,
            'numero_operador'         => strtoupper(trim($data['numero_operador'])),
            'nombre_completo'         => $data['nombre_completo'],
            'telefono'                => $data['telefono'] ?? null,
            'licencia_mx'             => strtoupper(trim($data['licencia_mx'])),
            'licencia_mx_vencimiento' => $data['licencia_mx_vencimiento'] ?: null,
            'licencia_usa'            => isset($data['licencia_usa']) ? strtoupper(trim($data['licencia_usa'])) : null,
            'licencia_usa_vencimiento'=> $data['licencia_usa_vencimiento'] ?: null,
            'visa_vencimiento'        => $data['visa_vencimiento'] ?: null,
            'poliza_seguro'           => $data['poliza_seguro'] ?? null,
            'poliza_seguro_vencimiento'=> $data['poliza_seguro_vencimiento'] ?: null,
            'permiso_especial'        => $data['permiso_especial'] ?? null,
            'permiso_especial_vencimiento'=> $data['permiso_especial_vencimiento'] ?: null,
            'fecha_ingreso'           => $data['fecha_ingreso'] ?: date('Y-m-d'),
            'activo'                  => 1,
        ];

        $id = $db->table('operadores')->insert($insert, true);

        return $this->json([
            'ok'        => true,
            'id'        => $id,
            'usuario_id'=> $usuarioId,
            'email'     => $email,
            'password_inicial' => 'cif2026',
        ], 201);
    }

    public function update(int $id): \CodeIgniter\HTTP\ResponseInterface
    {
        $raw = $this->request->getJSON(true);
        $data = [];
        if (isset($raw['nombreCompleto'])) $data['nombre_completo'] = $raw['nombreCompleto'];
        if (isset($raw['licencia'])) $data['licencia_mx'] = $raw['licencia'];
        if (isset($raw['visa'])) $data['licencia_usa'] = $raw['visa'];
        if (isset($raw['fast'])) $data['licencia_usa'] = $raw['fast'];
        if (isset($raw['telefono'])) $data['telefono'] = $raw['telefono'];
        if (isset($raw['activo'])) $data['activo'] = $raw['activo'] ? 1 : 0;
        if (isset($raw['vigenciaLicencia'])) $data['licencia_mx_vencimiento'] = $raw['vigenciaLicencia'];
        if (isset($raw['vigenciaVisa'])) $data['licencia_usa_vencimiento'] = $raw['vigenciaVisa'];
        
        if (!empty($data)) {
            $this->db()->table('operadores')->where('id', $id)->update($data);
        }
        return $this->json(['ok' => true]);
    }

    public function misViajes(): ResponseInterface
    {
        $userId = session()->get('user_id');
        $db     = $this->db();
        $op     = $db->table('operadores')->where('usuario_id', $userId)->get()->getRowArray();
        if (!$op) return $this->json(['ok' => false], 404);

        $viajes = $db->query("
            SELECT v.*, t.numero_economico, c.numero_caja
            FROM viajes v
            LEFT JOIN tractocamiones t ON t.id = v.tractocamion_id
            LEFT JOIN cajas c ON c.id = v.caja_id
            WHERE v.operador_id = ? AND v.estatus != 'facturado'
            ORDER BY v.id DESC LIMIT 10
        ", [$op['id']])->getResultArray();

        return $this->json(['ok' => true, 'operador' => $op, 'viajes' => $viajes]);
    }

    public function delete(int $id): \CodeIgniter\HTTP\ResponseInterface
    {
        try {
            \Config\Database::connect()->table('operadores')->where('id', $id)->delete();
            return $this->json(['ok' => true]);
        } catch (\Exception $e) {
            return $this->json(['ok' => false, 'error' => 'No se puede eliminar porque esta asignado a otras tablas.'], 409);
        }
    }

    /**
     * Creacion rapida de operador desde Super Captura.
     * Solo requiere nombre_completo. Auto-genera numero_operador.
     * POST /operadores/rapido
     */
    public function rapido(): ResponseInterface
    {
        $data = $this->request->getJSON(true);
        $nombre = trim($data['nombre_completo'] ?? '');

        if (empty($nombre)) {
            return $this->json(['ok' => false, 'error' => 'El nombre del operador es requerido.'], 422);
        }

        $db = $this->db();

        // Auto-generar numero_operador unico: OP-XXXX
        $maxNum = $db->query("SELECT MAX(CAST(REPLACE(numero_operador, 'OP-', '') AS UNSIGNED)) AS max_n FROM operadores WHERE numero_operador LIKE 'OP-%'")->getRowArray();
        $siguiente = ($maxNum['max_n'] ?? 0) + 1;
        $numeroOperador = 'OP-' . str_pad($siguiente, 4, '0', STR_PAD_LEFT);

        // Crear usuario del sistema (email/password minimos)
        $email    = strtolower(str_replace(' ', '.', $numeroOperador)) . '@cif.mx';
        $password = password_hash('cif2026', PASSWORD_BCRYPT);

        $db->table('usuarios')->insert([
            'nombre'   => $nombre,
            'email'    => $email,
            'password' => $password,
            'rol'      => 'operador',
            'activo'   => 1,
        ]);
        $usuarioId = $db->insertID();

        // Insertar operador con datos minimos
        $db->table('operadores')->insert([
            'usuario_id'      => $usuarioId,
            'numero_operador' => $numeroOperador,
            'nombre_completo' => $nombre,
            'licencia_mx'     => 'PENDIENTE',
            'activo'          => 1,
            'fecha_ingreso'   => date('Y-m-d'),
        ]);
        $opId = $db->insertID();

        // Devolver el operador recien creado para auto-seleccion inmediata
        $operador = $db->table('operadores')->where('id', $opId)->get()->getRowArray();

        return $this->json([
            'ok'       => true,
            'id'       => $opId,
            'operador' => $operador,
        ], 201);
    }
}