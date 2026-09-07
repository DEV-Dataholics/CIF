<?php
$mysqli = new mysqli("localhost", "noodluis_DEV_CIF", "25SRT[qJDe?S", "noodluis_CIF");
// Check if any operators are referenced in viajes
$res = $mysqli->query("SELECT o.id, o.nombre_completo, COUNT(v.id) as viajes_count FROM operadores o LEFT JOIN viajes v ON v.operador_id = o.id GROUP BY o.id ORDER BY viajes_count DESC LIMIT 15");
while($row = $res->fetch_assoc()) {
    echo json_encode($row) . "\n";
}

