<?php
namespace App\Models;
use CodeIgniter\Model;
class TipoMovimientoModel extends Model
{
    protected $table = 'tiposMovimiento';
    protected $primaryKey = 'id';
    protected $allowedFields = ['nombre', 'clienteAsociado'];
    protected $useTimestamps = true;
}
