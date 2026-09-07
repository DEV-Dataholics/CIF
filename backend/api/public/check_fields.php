<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
try {
    $db = new PDO('mysql:host=localhost;dbname=noodluis_CIF', 'noodluis_DEV_CIF', '25SRT[qJDe?S');
    $r1 = $db->query("SELECT id, razon_social FROM clientes LIMIT 2");
    echo "Clientes: "; print_r($r1->fetchAll(PDO::FETCH_ASSOC));
    $r2 = $db->query("SELECT id, numero_economico FROM tractocamiones LIMIT 2");
    echo "Tractos: "; print_r($r2->fetchAll(PDO::FETCH_ASSOC));
    $r3 = $db->query("SELECT id, nombre_completo FROM operadores LIMIT 2");
    echo "Operadores: "; print_r($r3->fetchAll(PDO::FETCH_ASSOC));
    $r4 = $db->query("SELECT id, numero_caja FROM cajas LIMIT 2");
    echo "Cajas: "; print_r($r4->fetchAll(PDO::FETCH_ASSOC));
} catch(Exception $e) { echo $e->getMessage(); }
