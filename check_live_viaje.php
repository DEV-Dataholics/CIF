<?php
$mysqli = new mysqli("localhost", "noodluis_DEV_CIF", "25SRT[qJDe?S", "noodluis_CIF");
$res = $mysqli->query("SELECT id, folio_boleta, tipo_movimiento, cliente_id, created_at FROM viajes ORDER BY created_at DESC LIMIT 10");
while($row = $res->fetch_assoc()){
    echo json_encode($row) . "\n";
}

