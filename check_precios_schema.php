
<?php
$mysqli = new mysqli("localhost", "noodluis_DEV_CIF", "25SRT[qJDe?S", "noodluis_CIF");
$res = $mysqli->query("DESCRIBE precios");
while($row = $res->fetch_assoc()){
    print_r($row);
}

