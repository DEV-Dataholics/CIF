<?php

namespace App\Filters;

use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Filters\FilterInterface;

/**
 * CIF — AuthFilter
 * Protege todas las rutas bajo /api/* (excepto auth/login y auth/logout).
 * Verifica que exista una sesión PHP activa con user_id.
 */
class AuthFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $origin = $request->getHeaderLine('Origin') ?: 'http://127.0.0.1:5500';

        // Agregar headers CORS a todas las respuestas protegidas
        $response = service('response');
        $response->setHeader('Access-Control-Allow-Origin', $origin);
        $response->setHeader('Access-Control-Allow-Credentials', 'true');
        $response->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Requested-With');

        // Verificar sesión activa
        if (!session()->get('user_id')) {
            return $response
                ->setStatusCode(401)
                ->setJSON(['ok' => false, 'mensaje' => 'No autenticado. Inicia sesión.']);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // No-op
    }
}
