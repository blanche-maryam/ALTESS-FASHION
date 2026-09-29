<?php
// =============================================================================
// ALTESS FASHION — API Upload générique (admin)
// =============================================================================

require_once __DIR__ . '/../../index.php';
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

requireAdmin();

define('UPLOAD_ROOT', dirname(__DIR__, 3) . '/public/uploads');

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024;

$folder = (($_GET['folder'] ?? 'products') === 'categories') ? 'categories' : 'products';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (empty($_FILES['image']) && empty($_FILES['images'])) {
        apiError('Aucune image fournie', 400);
    }

    $files = !empty($_FILES['images'])
        ? array_map(
            fn($i) => [
                'name'     => $_FILES['images']['name'][$i],
                'type'     => $_FILES['images']['type'][$i],
                'tmp_name' => $_FILES['images']['tmp_name'][$i],
                'error'    => $_FILES['images']['error'][$i],
                'size'     => $_FILES['images']['size'][$i],
            ],
            array_keys($_FILES['images']['name'])
        )
        : [$_FILES['image']];

    $dir = UPLOAD_ROOT . '/' . $folder;
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    $saved = [];
    foreach ($files as $file) {
        if ($file['error'] === UPLOAD_ERR_NO_FILE) continue;
        if ($file['error'] !== UPLOAD_ERR_OK) apiError("Erreur d'upload (code {$file['error']})", 400);
        if ($file['size'] > MAX_SIZE) apiError('Fichier trop volumineux (max 5 Mo)', 413);

        $info = @getimagesize($file['tmp_name']);
        if ($info === false || !in_array($info['mime'], ALLOWED_MIMES, true)) {
            apiError('Format non autorisé (JPG, PNG, WEBP, GIF uniquement)', 415);
        }

        $extMap = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
        $base = slugify(pathinfo($file['name'], PATHINFO_FILENAME)) ?: 'image';
        $name = $base . '-' . bin2hex(random_bytes(6)) . '.' . $extMap[$info['mime']];

        if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $name)) {
            apiError("Impossible d'enregistrer l'image", 500);
        }
        $saved[] = $folder . '/' . $name;
    }

    if (empty($saved)) apiError('Aucune image valide dans la requête', 400);

    apiSuccess(count($saved) > 1 ? count($saved) . ' images uploadées' : 'Image uploadée', [
        'image_path' => $saved[0],
        'image_paths' => $saved,
        'url'        => '/altess-fashion/public/uploads/' . $saved[0],
    ], 201);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $path = sanitizeText($_GET['path'] ?? null, 500);
    if (!$path) apiError('Chemin requis');
    if (strpos($path, '..') !== false) apiError('Chemin invalide', 400);

    $absolute = UPLOAD_ROOT . '/' . $folder . '/' . basename($path);
    if (is_file($absolute)) {
        unlink($absolute);
        apiSuccess('Image supprimée');
    }
    apiError('Image introuvable', 404);
}

apiError('Méthode non autorisée', 405);
