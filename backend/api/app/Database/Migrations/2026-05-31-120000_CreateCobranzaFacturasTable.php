<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateCobranzaFacturasTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'INT',
                'constraint' => 10,
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'folio' => [
                'type' => 'VARCHAR',
                'constraint' => 100,
            ],
            'uuid' => [
                'type' => 'VARCHAR',
                'constraint' => 100,
                'null' => true,
            ],
            'cliente' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'concepto' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'monto' => [
                'type' => 'DECIMAL',
                'constraint' => '12,2',
                'default' => 0.00,
            ],
            'subtotal' => [
                'type' => 'DECIMAL',
                'constraint' => '12,2',
                'default' => 0.00,
            ],
            'moneda' => [
                'type' => 'VARCHAR',
                'constraint' => 10,
                'default' => 'MXN',
            ],
            'forma_pago' => [
                'type' => 'VARCHAR',
                'constraint' => 50,
                'null' => true,
            ],
            'metodo_pago' => [
                'type' => 'VARCHAR',
                'constraint' => 50,
                'null' => true,
            ],
            'rfc_emisor' => [
                'type' => 'VARCHAR',
                'constraint' => 20,
                'null' => true,
            ],
            'rfc_receptor' => [
                'type' => 'VARCHAR',
                'constraint' => 20,
                'null' => true,
            ],
            'nombre_emisor' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
                'null' => true,
            ],
            'fecha_emision' => [
                'type' => 'DATE',
            ],
            'fecha_vencimiento' => [
                'type' => 'DATE',
                'null' => true,
            ],
            'fecha_pago' => [
                'type' => 'DATE',
                'null' => true,
            ],
            'estatus' => [
                'type' => 'ENUM',
                'constraint' => ['pendiente', 'pagada', 'cancelada'],
                'default' => 'pendiente',
            ],
            'notas' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'created_by' => [
                'type' => 'INT',
                'constraint' => 10,
                'unsigned' => true,
                'null' => true,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
            ],
            'updated_at datetime default current_timestamp on update current_timestamp',
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey('folio', 'uq_cobranza_folio');
        $this->forge->addUniqueKey('uuid', 'uq_cobranza_uuid');
        $this->forge->addKey('estatus');
        $this->forge->addKey('fecha_emision');
        $this->forge->createTable('cobranza_facturas', true);
    }

    public function down()
    {
        $this->forge->dropTable('cobranza_facturas', true);
    }
}
