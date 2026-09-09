<?php
namespace App\Controllers;
use CodeIgniter\HTTP\ResponseInterface;

class AuditoriaController extends BaseController
{
    public function index(): ResponseInterface
    {
        $db = \Config\Database::connect();
        
        $logs = $db->table('auditoria_logs')
            ->select('auditoria_logs.*, usuarios.nombre as usuario_nombre')
            ->join('usuarios', 'usuarios.id = auditoria_logs.usuario_id', 'left')
            ->orderBy('auditoria_logs.id', 'DESC')
            ->limit(500)
            ->get()->getResultArray();

        return $this->response
            ->setHeader('Access-Control-Allow-Origin', '*')
            ->setJSON($logs);
    }
}
