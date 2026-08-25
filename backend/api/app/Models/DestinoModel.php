<?php
namespace App\Models;
use CodeIgniter\Model;

class DestinoModel extends Model
{
    protected $table = 'destinos';
    protected $primaryKey = 'id';
    protected $allowedFields = ['nombre', 'tipo', 'ciudad', 'estado', 'pais', 'activo'];
    protected $useTimestamps = true;
}
