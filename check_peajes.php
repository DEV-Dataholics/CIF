
<?php
$mysqli = new mysqli("localhost", "noodluis_DEV_CIF", "25SRT[qJDe?S", "noodluis_CIF");
if ($mysqli->connect_error) { die("Connection failed: " . $mysqli->connect_error); }
$res = $mysqli->query("SELECT * FROM peajes");
if ($res) {
    while($row = $res->fetch_assoc()){
        print_r($row);
    }
}

