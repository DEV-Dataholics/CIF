<?php
$mysqli = new mysqli("localhost", "noodluis_DEV_CIF", "25SRT[qJDe?S", "noodluis_CIF");
$res = $mysqli->query("DESCRIBE viajes");
while($row = $res->fetch_assoc()){
    echo $row['Field'] . " - " . $row['Type'] . "\n";
}
