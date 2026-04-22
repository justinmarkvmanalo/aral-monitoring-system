<?php
date_default_timezone_set('Asia/Manila');

function db_config(): array
{
    $databaseUrl = getenv('DATABASE_URL') ?: getenv('SUPABASE_DB_URL') ?: '';
    if ($databaseUrl !== '') {
        $parts = parse_url($databaseUrl);
        if ($parts !== false) {
            return [
                'host' => $parts['host'] ?? '',
                'port' => isset($parts['port']) ? (int) $parts['port'] : 5432,
                'dbname' => isset($parts['path']) ? ltrim($parts['path'], '/') : '',
                'user' => $parts['user'] ?? '',
                'password' => $parts['pass'] ?? '',
                'sslmode' => getenv('SUPABASE_DB_SSLMODE') ?: 'require',
            ];
        }
    }

    return [
        'host' => getenv('SUPABASE_DB_HOST') ?: '',
        'port' => (int) (getenv('SUPABASE_DB_PORT') ?: 5432),
        'dbname' => getenv('SUPABASE_DB_NAME') ?: 'postgres',
        'user' => getenv('SUPABASE_DB_USER') ?: '',
        'password' => getenv('SUPABASE_DB_PASSWORD') ?: '',
        'sslmode' => getenv('SUPABASE_DB_SSLMODE') ?: 'require',
    ];
}

function db_connect(): PDO
{
    $cfg = db_config();
    if ($cfg['host'] === '' || $cfg['user'] === '' || $cfg['password'] === '') {
        throw new RuntimeException('Missing Supabase database environment variables.');
    }

    $dsn = sprintf(
        'pgsql:host=%s;port=%d;dbname=%s;sslmode=%s',
        $cfg['host'],
        $cfg['port'],
        $cfg['dbname'],
        $cfg['sslmode']
    );

    return new PDO($dsn, $cfg['user'], $cfg['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

try {
    $conn = db_connect();
} catch (Throwable $e) {
    if (ob_get_level()) {
        ob_end_clean();
    }
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'DB connection failed']);
    exit;
}
