<?php
// =============================================================================
// ALTESS FASHION — API Images (admin)
// =============================================================================

require_once __DIR__ . '/../../index.php';
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Product.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

requireAdmin();

$db = getDB();
$productModel = new Product($db);

$method = $_SERVER['REQUEST_METHOD'];
$productId = queryInt($_GET['product_id'] ?? null);

// Chemin web des uploads : /altess-fashion/public/uploads
define('UPLOAD_ROOT', dirname(__DIR__, 3) . '/public/uploads');
define('UPLOAD_WEB_BASE', '/altess-fashion/public/uploads');

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXT  = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const MAX_SIZE      = 5 * 1024 * 1024;

function detectMime(string $filePath): ?string
{
    $info = @getimagesize($filePath);
    if ($info === false) return null;
    return $info['mime'] ?: null;
}

function resolveUploadDir(string $sub): string
{
    $dir = UPLOAD_ROOT . '/' . $sub;
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    return $dir;
}

function storeUpload(array $file, string $sub): string
{
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $messages = [
            UPLOAD_ERR_INI_SIZE   => 'Fichier trop volumineux (serveur)',
            UPLOAD_ERR_FORM_SIZE  => 'Fichier trop volumineux',
            UPLOAD_ERR_NO_FILE    => 'Aucune image fournie',
            UPLOAD_ERR_PARTIAL    => 'Upload incomplet',
        ];
        apiError($messages[$file['error']] ?? "Erreur d'upload (code {$file['error']})", 400);
    }
    if ($file['size'] > MAX_SIZE) {
        apiError('Fichier trop volumineux (max 5 Mo)', 413);
    }

    $mime = detectMime($file['tmp_name']);
    if ($mime === null || !in_array($mime, ALLOWED_MIMES, true)) {
        apiError('Format non autorisé (JPG, PNG, WEBP, GIF uniquement)', 415);
    }

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ALLOWED_EXT, true)) {
        $ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'][$mime] ?? 'jpg';
    }

    $safeBase = slugify(pathinfo($file['name'], PATHINFO_FILENAME)) ?: 'image';
    $newName = $safeBase . '-' . bin2hex(random_bytes(6)) . '.' . $ext;
    $destination = resolveUploadDir($sub) . '/' . $newName;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        apiError("Impossible d'enregistrer l'image", 500);
    }

    return $sub . '/' . $newName;
}

// -------------------------------------------------------------------------
// GET : lister les images d'un produit
// -------------------------------------------------------------------------
if ($method === 'GET') {
    if (!$productId) apiError('product_id requis');
    if (!$productModel->findById($productId)) apiError('Produit non trouvé', 404);
    apiJson(['images' => $productModel->getImages($productId)]);
}

// -------------------------------------------------------------------------
// POST : ajouter une ou plusieurs images à un produit
// -------------------------------------------------------------------------
if ($method === 'POST') {
    if (!$productId) apiError('product_id requis');
    if (!$productModel->findById($productId)) apiError('Produit non trouvé', 404);

    $sub = (($_GET['folder'] ?? 'products') === 'categories') ? 'categories' : 'products';

    $body = readJsonBody();
    $added = [];

    if (!empty($_FILES['images']) && is_array($_FILES['images']['name'])) {
        $count = count($_FILES['images']['name']);
        if ($count > 8) apiError('Maximum 8 images par envoi', 422);
        for ($i = 0; $i < $count; $i++) {
            if ($_FILES['images']['error'][$i] === UPLOAD_ERR_NO_FILE) continue;
            $file = [
                'name'     => $_FILES['images']['name'][$i],
                'type'     => $_FILES['images']['type'][$i],
                'tmp_name' => $_FILES['images']['tmp_name'][$i],
                'error'    => $_FILES['images']['error'][$i],
                'size'     => $_FILES['images']['size'][$i],
            ];
            $path = storeUpload($file, $sub);
            $alt = sanitizeText($_POST['alt_text'][$i] ?? null, 255);
            $productModel->addImage($productId, $path, $alt, $i);
            $added[] = $path;
        }
    } elseif (!empty($_FILES['image'])) {
        $path = storeUpload($_FILES['image'], $sub);
        $alt = sanitizeText($_POST['alt_text'] ?? null, 255);
        $productModel->addImage($productId, $path, $alt, count($productModel->getImages($productId)));
        $added[] = $path;
    } elseif (!empty($_GET['primary']) && !empty($_GET['image_id'])) {
        if (!$productModel->setPrimaryImage($productId, (int) $_GET['image_id'])) {
            apiError('Image non trouvée', 404);
        }
        apiSuccess('Image principale définie', ['images' => $productModel->getImages($productId)]);
    } elseif (!empty($body['path']) || !empty($_POST['path'])) {
        // Image déjà téléversée via /api/upload.php
        $path = sanitizeText($body['path'] ?? $_POST['path'], 500);
        $alt = sanitizeText($body['alt_text'] ?? $_POST['alt_text'] ?? null, 255);
        $productModel->addImage($productId, $path, $alt, count($productModel->getImages($productId)));
        $added[] = $path;
    } else {
        apiError('Aucune image fournie', 400);
    }

    if (empty($added)) apiError('Aucune image valide dans la requête', 400);

    apiSuccess('Image(s) ajoutée(s)', [
        'added'  => $added,
        'images' => $productModel->getImages($productId),
    ], 201);
}

// -------------------------------------------------------------------------
// DELETE : retirer une image
// -------------------------------------------------------------------------
if ($method === 'DELETE') {
    if (!$productId) apiError('product_id requis');
    $imageId = queryInt($_GET['image_id'] ?? null);
    if (!$imageId) apiError('image_id requis');

    $images = $productModel->getImages($productId);
    $target = null;
    foreach ($images as $img) {
        if ((int) $img['id'] === $imageId) { $target = $img; break; }
    }
    if (!$target) apiError('Image non trouvée', 404);

    $path = $target['image_path'];
    $productModel->deleteImage($productId, $imageId);

    $absolute = UPLOAD_ROOT . '/' . basename(dirname($path)) . '/' . basename($path);
    if (is_file($absolute) && strpos($path, 'uploads/') !== false) {
        @unlink($absolute);
    }

    apiSuccess('Image supprimée', ['images' => $productModel->getImages($productId)]);
}

apiError('Endpoint non trouvé', 404);
