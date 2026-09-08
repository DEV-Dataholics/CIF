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
        $data = $this->request->getJSON(true);
        if (empty($data['email']) || empty($data['password'])) {
            return $this->json(['ok' => false, 'error' => 'Email y contraseña son requeridos'], 422);
        }
        $data['password'] = password_hash($data['password'], PASSWORD_BCRYPT);
        $data['activo'] = isset($data['activo']) ? ($data['activo'] ? 1 : 0) : 1;
        $id = $this->db()->table('usuarios')->insert($data, true);
        return $this->json(['ok' => true, 'id' => $id]);
    }

    public function update(int $id): ResponseInterface
    {
        $raw = $this->request->getJSON(true);
        $data = [];
        if (isset($raw['nombre'])) $data['nombre'] = $raw['nombre'];
        if (isset($raw['email'])) $data['email'] = $raw['email'];
        if (isset($raw['rol'])) $data['rol'] = $raw['rol'];
        if (isset($raw['permiso'])) $data['permiso'] = $raw['permiso'];
        if (isset($raw['activo'])) $data['activo'] = $raw['activo'] ? 1 : 0;
        
        if (!empty($raw['password'])) {
            $data['password'] = password_hash($raw['password'], PASSWORD_BCRYPT);
        }
        
        if (!empty($data)) {
            $this->db()->table('usuarios')->where('id', $id)->update($data);
        }
        return $this->json(['ok' => true]);
    }

    public function delete(int $id): ResponseInterface
    {
        $this->db()->table('usuarios')->where('id', $id)->delete();
        return $this->json(['ok' => true]);
    }
}
