<?php

namespace App\Filters;

use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Filters\FilterInterface;

class AuthFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        // Obtener el origen de la petición (localhost, 127.0.0.1, o Live Server)
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';

        $response = service('response');
        $response->setHeader('Access-Control-Allow-Origin', $origin);
        $response->setHeader('Access-Control-Allow-Credentials', 'true');
        $response->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

        // Si es una petición OPTIONS (Preflight), responder 200 inmediatamente
        if ($request->getMethod() === 'options') {
            return $response->setStatusCode(200);
        }

        // Evitar aplicar el filtro en las rutas de login
        $path = $request->getUri()->getPath();
        if (strpos($path, 'auth/login') !== false || strpos($path, 'auth/logout') !== false) {
            return;
        }

        // Validar sesión para el resto de la API
        if (!session()->get('user_id')) {
            return $response
                ->setStatusCode(401)
                ->setJSON(['ok' => false, 'mensaje' => 'Sesión expirada o no válida.']);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null) {}
}
