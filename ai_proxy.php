<?php
// ── Groq API Proxy ────────────────────────────────────────────
// Place this file at: htdocs/ai_proxy.php
// Get your free API key at: https://console.groq.com

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { http_response_code(405); echo json_encode(['error'=>'Method not allowed']); exit; }

// ── Your Groq API Key ─────────────────────────────────────────
// Free at: https://console.groq.com → API Keys → Create Key
$API_KEY = getenv('GROQ_API_KEY') ?: '';
if ($API_KEY === '') {
    http_response_code(500);
    echo json_encode(['error' => 'Missing GROQ_API_KEY server environment variable']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) { http_response_code(400); echo json_encode(['error'=>'Empty request']); exit; }

// Build Groq-compatible request (OpenAI format)
$groq_body = json_encode([
    'model'       => 'llama-3.3-70b-versatile',
    'messages'    => $input['messages'],
    'max_tokens'  => 1500,
    'temperature' => 0.2,
]);

$ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $groq_body,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $API_KEY,
    ],
    CURLOPT_TIMEOUT        => 60,
    CURLOPT_SSL_VERIFYPEER => true,
]);

$response  = curl_exec($ch);
$httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(['error' => 'Proxy error: ' . $curlError]);
    exit;
}

// Convert Groq response to the shape the frontend expects
$groq_data = json_decode($response, true);
$text = $groq_data['choices'][0]['message']['content'] ?? '';

http_response_code($httpCode);
echo json_encode([
    'content' => [['type' => 'text', 'text' => $text]]
]);
