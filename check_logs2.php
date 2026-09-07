
<?php
$logPath = __DIR__ . "/writable/logs/log-" . date("Y-m-d") . ".log";
if (file_exists($logPath)) {
    echo file_get_contents($logPath);
} else {
    echo "No log: " . $logPath;
}

