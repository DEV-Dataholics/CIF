<?php
$logFiles = glob(__DIR__ . "/../writable/logs/*.log");
if (empty($logFiles)) { echo "No logs found in " . __DIR__ . "/../writable/logs/"; exit; }
usort($logFiles, function($a, $b) { return filemtime($b) - filemtime($a); });
$latest = $logFiles[0];
$lines = file($latest);
echo "Reading: $latest\n";
echo implode("", array_slice($lines, -150));
