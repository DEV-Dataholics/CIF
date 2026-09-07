
<?php
$mysqli = new mysqli("localhost", "noodluis_DEV_CIF", "25SRT[qJDe?S", "noodluis_CIF");
if ($mysqli->connect_error) { die("Connection failed: " . $mysqli->connect_error); }

$q = "ALTER TABLE destinos 
ADD COLUMN estado VARCHAR(100) DEFAULT NULL,
ADD COLUMN pais VARCHAR(10) DEFAULT NULL,
ADD COLUMN activo TINYINT(1) DEFAULT 1";

if ($mysqli->query($q)) {
    echo "Columns added successfully";
} else {
    echo "Error: " . $mysqli->error;
}

