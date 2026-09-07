<?php
$mysqli = new mysqli("localhost", "noodluis_DEV_CIF", "25SRT[qJDe?S", "noodluis_CIF");
if ($mysqli->connect_error) { die("Connection failed: " . $mysqli->connect_error); }

$columns = [
    'peaje' => 'VARCHAR(50)',
    'sello' => 'VARCHAR(50)',
    'salio_origen' => 'VARCHAR(50)',
    'punto_revision' => 'VARCHAR(50)',
    'entrada_mx' => 'VARCHAR(50)',
    'salida_mx' => 'VARCHAR(50)',
    'entrada_am' => 'VARCHAR(50)',
    'salida_am' => 'VARCHAR(50)',
    'hora_entrega' => 'VARCHAR(50)',
    'cmt' => 'VARCHAR(100)',
    'factura' => 'VARCHAR(50)'
];

foreach ($columns as $col => $type) {
    $mysqli->query("ALTER TABLE viajes ADD COLUMN $col $type NULL");
}
echo "Done";
