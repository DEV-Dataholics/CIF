<?php
namespace App\Controllers;
use CodeIgniter\HTTP\ResponseInterface;

class UsuarioController extends BaseController
{
    private function db() { return \Config\Database::connect(); }
    
    private function json(array , int  = 200): ResponseInterface
    {
         = ->request->getHeaderLine('Origin') ?: '*';
        return ->response->setHeader('Access-Control-Allow-Origin', )
                              ->setHeader('Access-Control-Allow-Credentials', 'true')
                              ->setStatusCode()->setJSON();
    }

    public function index(): ResponseInterface
    {
         = ->db()->table('usuarios')->get()->getResultArray();
        // Remove passwords before sending to frontend
        foreach ( as &) { unset(['password']); }
        return ->json(['ok' => true, 'data' => ]);
    }

    public function create(): ResponseInterface
    {
         = ->request->getJSON(true);
        if (empty(['email']) || empty(['password'])) {
            return ->json(['ok' => false, 'error' => 'Email y contraseña son requeridos'], 422);
        }
        ['password'] = password_hash(['password'], PASSWORD_BCRYPT);
        ['activo'] = isset(['activo']) ? (['activo'] ? 1 : 0) : 1;
         = ->db()->table('usuarios')->insert(, true);
        return ->json(['ok' => true, 'id' => ]);
    }

    public function update(int ): ResponseInterface
    {
         = ->request->getJSON(true);
         = [];
        if (isset(['nombre'])) ['nombre'] = ['nombre'];
        if (isset(['email'])) ['email'] = ['email'];
        if (isset(['rol'])) ['rol'] = ['rol'];
        if (isset(['permiso'])) ['permiso'] = ['permiso'];
        if (isset(['activo'])) ['activo'] = ['activo'] ? 1 : 0;
        
        if (!empty(['password'])) {
            ['password'] = password_hash(['password'], PASSWORD_BCRYPT);
        }
        
        if (!empty()) {
            ->db()->table('usuarios')->where('id', )->update();
        }
        return ->json(['ok' => true]);
    }

    public function delete(int ): ResponseInterface
    {
        ->db()->table('usuarios')->where('id', )->delete();
        return ->json(['ok' => true]);
    }
}
