
<?php
$mysqli = new mysqli("localhost", "noodluis_DEV_CIF", "25SRT[qJDe?S", "noodluis_CIF");
if ($mysqli->connect_error) { die("Connection failed: " . $mysqli->connect_error); }
$res = $mysqli->query("DESCRIBE destinos");
if ($res) {
    while($row = $res->fetch_assoc()){
        echo $row["Field"] . " | " . $row["Type"] . "<br>";
    }
} else {
    echo $mysqli->error;
}

