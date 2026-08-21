<?php
namespace App\Models;
use CodeIgniter\Model;
class PrecioModel extends Model
{
    protected $table = 'precios';
    protected $primaryKey = 'id';
    protected $allowedFields = ['cliente_id', 'tipo_mov_id', 'precio', 'fecha_vigencia'];
    protected $useTimestamps = true;
}
