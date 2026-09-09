<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class TiposMovimientoSeeder extends Seeder
{
    public function run(): void
    {
        $db = \Config\Database::connect();
        $jsonPath = ROOTPATH . '../../frontend/src/data/tiposMovimiento.json';
        if (!file_exists($jsonPath)) {
            $jsonPath = dirname(ROOTPATH) . '/frontend/src/data/tiposMovimiento.json';
        }

        if (file_exists($jsonPath)) {
            $items = json_decode(file_get_contents($jsonPath), true);
            $builder = $db->table('tiposmovimiento');
            $builder->truncate();
            foreach ($items as $item) {
                $builder->insert([
                    'id' => $item['id'],
                    'nombre' => $item['nombre'],
                    'clienteAsociado' => $item['clienteAsociado'] ?? 'NA',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
            }
            echo "Seeded " . count($items) . " tipos de movimiento.\n";
        } else {
            echo "File not found: " . $jsonPath . "\n";
        }
    }
}
