
<?php
$mysqli = new mysqli("localhost", "noodluis_DEV_CIF", "25SRT[qJDe?S", "noodluis_CIF");
$res = $mysqli->query("SELECT id, nombre FROM tiposMovimiento");
while($row = $res->fetch_assoc()){
    echo $row["id"] . ": " . $row["nombre"] . "\n";
}

