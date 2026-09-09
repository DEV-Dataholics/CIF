<?php
namespace App\Filters;

use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Filters\FilterInterface;

class AuditFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        try {
            if (!method_exists($request, 'getMethod')) return;
            $method = strtoupper($request->getMethod());
            if (!in_array($method, ['POST', 'PUT', 'DELETE'])) return;
            if ($response->getStatusCode() >= 400) return;

            $session = \Config\Services::session();
            $userId = $session->get('user_id');
            if (!$userId) return;

            $path = method_exists($request, 'getUri') ? $request->getUri()->getPath() : '';
            $segments = explode('/', trim($path, '/'));
            
            if (in_array('auth', $segments) || in_array('login', $segments)) return;

            $entidad = $segments[0] ?? 'desconocido';
            $registroId = $segments[1] ?? null;

            if ($entidad === 'api' && isset($segments[1])) {
                $entidad = $segments[1];
                $registroId = $segments[2] ?? null;
            }

            $accion = 'DESCONOCIDO';
            if ($method === 'POST') $accion = 'CREAR';
            if ($method === 'PUT') $accion = 'EDITAR';
            if ($method === 'DELETE') $accion = 'ELIMINAR';

            if ($method === 'POST') {
                $bodyStr = $response->getBody();
                if ($bodyStr) {
                    $body = json_decode($bodyStr, true);
                    if (is_array($body) && isset($body['id'])) $registroId = $body['id'];
                }
            }

            $detalles = null;
            if (method_exists($request, 'getJSON')) {
                $raw = $request->getJSON(true) ?? [];
                if (is_array($raw)) {
                    if (isset($raw['password'])) $raw['password'] = '***';
                    if (!empty($raw)) $detalles = json_encode($raw);
                }
            }

            $ip = method_exists($request, 'getIPAddress') ? $request->getIPAddress() : null;

            $db = \Config\Database::connect();
            $db->table('auditoria_logs')->insert([
                'usuario_id'  => $userId,
                'accion'      => $accion,
                'entidad'     => $entidad,
                'registro_id' => $registroId,
                'detalles'    => $detalles,
                'ip_address'  => $ip,
                'creado_en'   => date('Y-m-d H:i:s')
            ]);
        } catch (\Throwable $e) {
            // Silenciosamente ignorar errores de log para no romper la app
            log_message('error', 'AuditFilter Exception: ' . $e->getMessage());
        }
    }
}
