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
    $pdo->exec("ALTER TABLE viajes MODIFY tipo_movimiento VARCHAR(255) NOT NULL;");
    echo "SUCCESS";
} catch (Exception $e) { echo $e->getMessage(); }
