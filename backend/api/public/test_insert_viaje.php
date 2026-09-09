<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
$host = 'localhost';
$db   = 'noodluis_CIF';
$user = 'noodluis_DEV_CIF';
$pass = '25SRT[qJDe?S';
$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
try {
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    // Send dummy insert matching Super Captura
    $stmt = $pdo->prepare("INSERT INTO viajes (cliente_id, tipo_movimiento, caja_id, origen, destino, via_cruce, folio_boleta, operador_id, tractocamion_id, fecha_salida, estatus, created_at) VALUES (1, 'auxiliar_taller', NULL, 'Origen', 'Destino', '', '', 1, 1, NULL, 'asignado', NOW())");
    $stmt->execute();
    echo "SUCCESS";
} catch (Exception $e) { echo $e->getMessage(); }
