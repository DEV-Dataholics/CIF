
<?php
$mysqli = new mysqli("localhost", "noodluis_DEV_CIF", "25SRT[qJDe?S", "noodluis_CIF");
if ($mysqli->connect_error) { die("Connection failed: " . $mysqli->connect_error); }

$q = "CREATE TABLE IF NOT EXISTS peajes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    puente VARCHAR(150) NOT NULL,
    tarifa VARCHAR(50),
    vigencia DATE,
    activo TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)";
if ($mysqli->query($q)) {
    echo "Table peajes created successfully\n";
    $mysqli->query("INSERT IGNORE INTO peajes (id, puente, tarifa, vigencia) VALUES
    (1, \"Zaragoza\", \"$185.00\", \"2026-12-31\"),
    (2, \"Córdova (Américas)\", \"$185.00\", \"2026-12-31\"),
    (3, \"Santa Teresa\", \"$210.00\", \"2026-12-31\"),
    (4, \"Stanton\", \"$195.00\", \"2026-12-31\")");
} else {
    echo "Error: " . $mysqli->error;
}

