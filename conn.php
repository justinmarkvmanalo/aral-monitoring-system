<?php
date_default_timezone_set('Asia/Manila');
$DB_HOST = "sql207.infinityfree.com";
$DB_USER = "if0_41078562";
$DB_PASS = "7zkSAZJUNj";
$DB_NAME = "if0_41078562_aral_monitor";

// create connection
$conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);

// catch connection error early
if ($conn->connect_error) {
    // Output JSON error instead of plain text
    if (ob_get_level()) ob_end_clean();
    header("Content-Type: application/json");
    http_response_code(500);
    echo json_encode(["ok"=>false,"error"=>"DB connection failed"]);
    exit;
}