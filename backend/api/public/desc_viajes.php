<?php
$db = new PDO('mysql:host=localhost;dbname=noodluis_CIF', 'noodluis_DEV_CIF', '25SRT[qJDe?S');
$stmt = $db->query("DESCRIBE viajes");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
