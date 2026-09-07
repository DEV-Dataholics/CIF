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
    $stmt = $pdo->query("SELECT * FROM tiposMovimiento LIMIT 2");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) { echo $e->getMessage(); }
