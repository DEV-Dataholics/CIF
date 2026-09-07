
<?php
$mysqli = new mysqli("localhost", "noodluis_DEV_CIF", "25SRT[qJDe?S", "noodluis_CIF");
if ($mysqli->connect_error) { die("Connection failed: " . $mysqli->connect_error); }

function check_table($mysqli, $table) {
    echo "TABLE: $table\n";
    $res = $mysqli->query("DESCRIBE $table");
    if ($res) {
        while($row = $res->fetch_assoc()){
            echo $row["Field"] . " | " . $row["Type"] . "\n";
        }
    } else {
        echo $mysqli->error;
    }
    echo "\n";
}

check_table($mysqli, "operadores");
check_table($mysqli, "cajas");
check_table($mysqli, "tractocamiones");
check_table($mysqli, "clientes");

