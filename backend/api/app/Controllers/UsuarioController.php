<?php
namespace App\Controllers;
use CodeIgniter\HTTP\ResponseInterface;

class UsuarioController extends BaseController
{
    private function db() { return \Config\Database::connect(); }
    
    private function json(array $data, int $status = 200): ResponseInterface
    {
        $origin = $this->request->getHeaderLine('Origin') ?: '*';
        return $this->response->setHeader('Access-Control-Allow-Origin', $origin)
                              ->setHeader('Access-Control-Allow-Credentials', 'true')
                              ->setStatusCode($status)->setJSON($data);
    }

    public function index(): ResponseInterface
    {
        $users = $this->db()->table('usuarios')->get()->getResultArray();
        // Remove passwords before sending to frontend
        foreach ($users as &$u) { unset($u['password']); }
        return $this->json(['ok' => true, 'data' => $users]);
    }

    public function create(): ResponseInterface
    {
        try {
            $raw = $this->request->getJSON(true) ?? [];
            $nombre = trim($raw['nombre'] ?? '');
            $email = strtolower(trim($raw['email'] ?? ''));
            $password = $raw['password'] ?? '';
            $rol = trim($raw['rol'] ?? 'operador');
            $activo = isset($raw['activo']) ? ($raw['activo'] ? 1 : 0) : 1;

            if (empty($nombre)) {
                return $this->json(['ok' => false, 'error' => 'El nombre completo es requerido.'], 422);
            }
            if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->json(['ok' => false, 'error' => 'Ingrese un correo electrónico válido.'], 422);
            }
            if (empty($password) || strlen($password) < 4) {
                return $this->json(['ok' => false, 'error' => 'La contraseña debe tener al menos 4 caracteres.'], 422);
            }

            $validRoles = ['admin', 'trafico', 'operador', 'facturacion', 'taller', 'porteria'];
            if (!in_array($rol, $validRoles, true)) {
                $rol = 'operador';
            }

            $db = $this->db();
            $existe = $db->table('usuarios')->where('email', $email)->countAllResults();
            if ($existe > 0) {
                return $this->json(['ok' => false, 'error' => 'El correo electrónico ya está registrado por otro usuario.'], 422);
            }

            $insertData = [
                'nombre'     => $nombre,
                'email'      => $email,
                'password'   => password_hash($password, PASSWORD_BCRYPT),
                'rol'        => $rol,
                'activo'     => $activo,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ];

            $db->table('usuarios')->insert($insertData);
            $id = (int)$db->insertID();

            $createdUser = [
                'id'         => $id,
                'nombre'     => $nombre,
                'email'      => $email,
                'rol'        => $rol,
                'activo'     => (bool)$activo,
                'created_at' => $insertData['created_at']
            ];

            return $this->json(['ok' => true, 'id' => $id, 'data' => $createdUser], 201);
        } catch (\Throwable $e) {
            log_message('error', 'Error en UsuarioController::create: ' . $e->getMessage());
            return $this->json(['ok' => false, 'error' => 'Error al crear usuario: ' . $e->getMessage()], 500);
        }
    }

    public function update(int $id): ResponseInterface
    {
        try {
            $raw = $this->request->getJSON(true) ?? [];
            $data = ['updated_at' => date('Y-m-d H:i:s')];
            $db = $this->db();

            if (isset($raw['nombre']) && trim($raw['nombre']) !== '') {
                $data['nombre'] = trim($raw['nombre']);
            }
            if (isset($raw['email']) && trim($raw['email']) !== '') {
                $email = strtolower(trim($raw['email']));
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    return $this->json(['ok' => false, 'error' => 'El correo electrónico no tiene un formato válido.'], 422);
                }
                $existe = $db->table('usuarios')->where('email', $email)->where('id !=', $id)->countAllResults();
                if ($existe > 0) {
                    return $this->json(['ok' => false, 'error' => 'El correo electrónico ya está en uso.'], 422);
                }
                $data['email'] = $email;
            }
            if (isset($raw['rol'])) {
                $validRoles = ['admin', 'trafico', 'operador', 'facturacion', 'taller', 'porteria'];
                if (in_array($raw['rol'], $validRoles, true)) {
                    $data['rol'] = $raw['rol'];
                }
            }
            if (isset($raw['activo'])) {
                $data['activo'] = $raw['activo'] ? 1 : 0;
            }
            if (!empty($raw['password']) && strlen($raw['password']) >= 4) {
                $data['password'] = password_hash($raw['password'], PASSWORD_BCRYPT);
            }

            $db->table('usuarios')->where('id', $id)->update($data);
            unset($data['password']);

            $updatedUser = $db->table('usuarios')->select('id, nombre, email, rol, activo, created_at, updated_at')->where('id', $id)->get()->getRowArray();
            return $this->json(['ok' => true, 'data' => $updatedUser ?: array_merge(['id' => $id], $data)]);
        } catch (\Throwable $e) {
            log_message('error', 'Error en UsuarioController::update: ' . $e->getMessage());
            return $this->json(['ok' => false, 'error' => 'Error al actualizar usuario: ' . $e->getMessage()], 500);
        }
    }

    public function delete(int $id): ResponseInterface
    {
        try {
            $this->db()->table('usuarios')->where('id', $id)->delete();
            return $this->json(['ok' => true]);
        } catch (\Throwable $e) {
            return $this->json(['ok' => false, 'error' => 'No se puede eliminar el usuario porque tiene registros vinculados.'], 409);
        }
    }
}
