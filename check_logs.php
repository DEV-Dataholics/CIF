
<?php
$logPath = "backend/api/writable/logs/log-" . date("Y-m-d") . ".log";
if (file_exists($logPath)) {
    echo tailCustom($logPath, 20);
} else {
    echo "No log for today.";
}

function tailCustom($filepath, $lines = 10) {
    $f = fopen($filepath, "r");
    $cursor = -1;
    $output = [];
    while (count($output) < $lines && fseek($f, $cursor, SEEK_END) !== -1) {
        $char = fgetc($f);
        if ($char === "\n") {
            $output[] = "";
        }
        $output[count($output)-1] .= $char;
        $cursor--;
    }
    return implode("", array_reverse($output));
}

