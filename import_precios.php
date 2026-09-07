
<?php
$mysqli = new mysqli("localhost", "noodluis_DEV_CIF", "25SRT[qJDe?S", "noodluis_CIF");
if ($mysqli->connect_error) { die("Connection failed: " . $mysqli->connect_error); }

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data) { die("No JSON provided"); }

$clientes = [];
$res = $mysqli->query("SELECT id, razon_social FROM clientes");
while($row = $res->fetch_assoc()) {
    $clientes[strtolower(trim($row["razon_social"]))] = $row["id"];
}

$tipos = [];
$res = $mysqli->query("SELECT id, nombre FROM tiposMovimiento");
while($row = $res->fetch_assoc()) {
    $tipos[strtolower(trim($row["nombre"]))] = $row["id"];
}

$inserted = 0;
foreach($data as $p) {
    $cName = strtolower(trim($p["cliente"]));
    $tName = strtolower(trim($p["tipoMovimiento"]));
    
    $cId = isset($clientes[$cName]) ? $clientes[$cName] : null;
    $tId = isset($tipos[$tName]) ? $tipos[$tName] : null;
    
    if (!$cId) {
        $mysqli->query("INSERT INTO clientes (razon_social) VALUES (\"" . $mysqli->real_escape_string($p["cliente"]) . "\")");
        $cId = $mysqli->insert_id;
        $clientes[$cName] = $cId;
    }
    
    if (!$tId) {
        $mysqli->query("INSERT INTO tiposMovimiento (nombre) VALUES (\"" . $mysqli->real_escape_string($p["tipoMovimiento"]) . "\")");
        $tId = $mysqli->insert_id;
        $tipos[$tName] = $tId;
    }
    
    $precio = $p["dolares"];
    if ($precio === null || $precio === "") $precio = $p["pesos"];
    if ($precio === null || $precio === "") $precio = 0;
    
    $q = "INSERT INTO precios (cliente_id, tipo_mov_id, precio, fecha_vigencia) VALUES ($cId, $tId, $precio, \"2026-08-25\")";
    $mysqli->query($q);
    $inserted++;
}
echo "Inserted $inserted records.";

