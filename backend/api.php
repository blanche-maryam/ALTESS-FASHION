<?php
// =============================================================================
// ALTESS FASHION — Routeur API centralisé
// =============================================================================

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/error.log');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers.php';

// Normaliser l'URL pour que les contrôleurs voient un chemin cohérent
$originalUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (strpos($originalUri, 'api.php') !== false) {
    $cleanPath = '/api' . substr($originalUri, strpos($originalUri, 'api.php') + 7);
} elseif (strpos($originalUri, '/api/') !== false) {
    $cleanPath = $originalUri;
} else {
    $cleanPath = '/api/' . ltrim($originalUri, '/');
}

$_SERVER['REQUEST_URI'] = $cleanPath;

// Extraire les paramètres GET
parse_str($_SERVER['QUERY_STRING'] ?? '', $queryParams);
$_GET = array_merge($_GET, $queryParams);

$method = $_SERVER['REQUEST_METHOD'];
$path = $cleanPath;

// Déterminer le fichier contrôleur
$baseDir = __DIR__ . '/api/';
$controllerFile = null;

// Pattern: /api/{dir}/{file}.php (ex: /api/auth/login.php)
if (preg_match('#^/api/([^/]+)/([^/]+)\.php$#', $path, $m)) {
    $candidates = [
        $baseDir . $m[1] . '/' . $m[2] . '.php',
        $baseDir . $m[1] . '/index.php',
    ];
    foreach ($candidates as $c) {
        if (file_exists($c)) { $controllerFile = $c; break; }
    }
}

// Pattern: /api/{file}.php (ex: /api/products.php)
if (!$controllerFile && preg_match('#^/api/([^/]+)\.php$#', $path, $m)) {
    $candidates = [
        $baseDir . $m[1] . '.php',
        $baseDir . $m[1] . '/index.php',
    ];
    foreach ($candidates as $c) {
        if (file_exists($c)) { $controllerFile = $c; break; }
    }
}

// Alias : /api/{name} sans extension → contrôleur {name}/index.php
if (!$controllerFile && preg_match('#^/api/([^/]+)$#', $path, $m)) {
    $candidate = $baseDir . $m[1] . '/index.php';
    if (file_exists($candidate)) { $controllerFile = $candidate; }
}

if (!$controllerFile) {
    http_response_code(404);
    echo json_encode(['error' => 'API non trouvée: ' . $path]);
    exit;
}

try {
    require_once $controllerFile;
} catch (Throwable $e) {
    error_log('[api] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode(['error' => 'Erreur interne du serveur']);
    exit;
}
