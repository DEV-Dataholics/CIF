<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class AuthController extends BaseController
{
    private function json(array $data, int $code = 200): ResponseInterface
    {
        $origin = $this->request->getHeaderLine('Origin');
        if (!$origin) {
            $scheme = $this->request->isSecure() ? 'https' : 'http';
            $origin = $scheme . '://' . $this->request->getServer('HTTP_HOST');
        }
        return $this->response
            ->setHeader('Access-Control-Allow-Origin', $origin)
            ->setHeader('Access-Control-Allow-Credentials', 'true')
            ->setStatusCode($code)
            ->setJSON($data);
    }

    public function login(): ResponseInterface
    {
        $body     = $this->request->getJSON(true) ?? [];
        $email    = trim($body['email']    ?? '');
        $password = trim($body['password'] ?? '');

        if (!$email || !$password) {
            return $this->json(['ok' => false, 'mensaje' => 'Faltan credenciales.'], 400);
        }

        $db = \Config\Database::connect();
        $usuario = $db->table('usuarios')
            ->where('email', $email)
            ->where('activo', 1)
            ->get()->getRowArray();

        if (!$usuario || !password_verify($password, $usuario['password'])) {
            return $this->json(['ok' => false, 'mensaje' => 'Credenciales inválidas.'], 401);
        }

        $db->table('usuarios')->where('id', $usuario['id'])->update(['ultimo_acceso' => date('Y-m-d H:i:s')]);

        $session = session();
        $session->regenerate(true);
        $session->set([
            'user_id'     => $usuario['id'],
            'user_rol'    => $usuario['rol'],
            'user_nombre' => $usuario['nombre'],
        ]);

        $numero_operador = null;
        if ($usuario['rol'] === 'operador') {
            $op = $db->table('operadores')->where('usuario_id', $usuario['id'])->get()->getRowArray();
            $numero_operador = $op['numero_operador'] ?? null;
        }

        unset($usuario['password']);
        $usuario['numero_operador'] = $numero_operador;

        return $this->json(['ok' => true, 'usuario' => $usuario]);
    }

    public function logout(): ResponseInterface
    {
        session()->destroy();
        return $this->json(['ok' => true]);
    }

    public function me(): ResponseInterface
    {
        $userId = session()->get('user_id');
        if (!$userId) return $this->json(['ok' => false, 'mensaje' => 'No session'], 401);

        $db      = \Config\Database::connect();
        $usuario = $db->table('usuarios')->select('id, nombre, email, rol, activo')->where('id', $userId)->get()->getRowArray();

        if (!$usuario) {
            session()->destroy();
            return $this->json(['ok' => false], 401);
        }

        $numero_operador = null;
        if ($usuario['rol'] === 'operador') {
            $op = $db->table('operadores')->where('usuario_id', $userId)->get()->getRowArray();
            $numero_operador = $op['numero_operador'] ?? null;
        }
        $usuario['numero_operador'] = $numero_operador;

        return $this->json(['ok' => true, 'usuario' => $usuario]);
    }
}
