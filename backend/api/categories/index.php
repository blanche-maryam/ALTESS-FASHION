<?php
// =============================================================================
// ALTESS FASHION — API Catégories (CRUD admin complet)
// =============================================================================

require_once __DIR__ . '/../../index.php';
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Category.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$db = getDB();
$categoryModel = new Category($db);

$method = $_SERVER['REQUEST_METHOD'];
$id = queryInt($_GET['id'] ?? null);
$validAudiences = ['female', 'male', 'unisex'];

// -------------------------------------------------------------------------
// GET
// -------------------------------------------------------------------------
if ($method === 'GET') {
    if ($id) {
        $category = $categoryModel->findById($id);
        if (!$category) apiError('Catégorie non trouvée', 404);
        $category['subcategories'] = $categoryModel->getSubcategories($id, false);
        apiJson(['category' => $category]);
    }

    if (!empty($_GET['tree'])) {
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = max(1, min(100, (int) ($_GET['per_page'] ?? 10)));
        $total = $categoryModel->countRoots();
        apiJson([
            'categories' => $categoryModel->getTree($page, $perPage),
            'flat'       => $categoryModel->getAll(false),
            'total'      => $total,
            'page'       => $page,
            'per_page'   => $perPage,
            'pages'      => (int) ceil($total / $perPage),
        ]);
    }

    if (!empty($_GET['roots'])) {
        apiJson(['categories' => $categoryModel->getRoots(!isAdmin())]);
    }

    if (!empty($_GET['subcategories_of'])) {
        apiJson(['categories' => $categoryModel->getSubcategories((int) $_GET['subcategories_of'], false)]);
    }

    // Les admins voient les catégories inactives aussi
    $includeInactive = isAdmin() || !empty($_GET['all']);
    apiJson(['categories' => $categoryModel->getAll(!$includeInactive)]);
}

// -------------------------------------------------------------------------
// POST
// -------------------------------------------------------------------------
if ($method === 'POST') {
    requireAdmin();

    $data = readJsonBody();
    $name = sanitizeText($data['name'] ?? null, 100);
    if (!$name) apiError('Le nom est requis', 422);

    $parentId = !empty($data['parent_id']) ? (int) $data['parent_id'] : null;
    if ($parentId && !$categoryModel->findById($parentId)) {
        apiError('Catégorie parente introuvable', 422);
    }
    if ($parentId && $categoryModel->isDescendant($parentId, $id ?? 0)) {
        apiError('Parent invalide', 422);
    }

    $slug = $categoryModel->uniqueSlug(!empty($data['slug']) ? slugify((string) $data['slug']) : slugify($name));

    $categoryId = $categoryModel->create([
        'name'            => $name,
        'slug'            => $slug,
        'parent_id'       => $parentId,
        'target_audience' => in_array($data['target_audience'] ?? '', $validAudiences, true) ? $data['target_audience'] : 'unisex',
        'image'           => sanitizeText($data['image'] ?? null, 500),
        'is_active'       => array_key_exists('is_active', $data) ? boolFromInput($data['is_active']) : 1,
        'sort_order'      => (int) ($data['sort_order'] ?? 0),
    ]);

    apiSuccess('Catégorie créée', [
        'id'       => $categoryId,
        'category' => $categoryModel->findById($categoryId),
    ], 201);
}

// -------------------------------------------------------------------------
// PUT / PATCH
// -------------------------------------------------------------------------
if ($method === 'PUT' || $method === 'PATCH') {
    requireAdmin();
    if (!$id) apiError('ID requis');

    $existing = $categoryModel->findById($id);
    if (!$existing) apiError('Catégorie non trouvée', 404);

    $data = readJsonBody();
    $payload = [];

    if (array_key_exists('name', $data)) {
        $name = sanitizeText($data['name'], 100);
        if (!$name) apiError('Le nom ne peut pas être vide', 422);
        $payload['name'] = $name;
    }

    if (array_key_exists('parent_id', $data)) {
        $parentId = ($data['parent_id'] === '' || $data['parent_id'] === null) ? null : (int) $data['parent_id'];
        if ($parentId === $id) apiError('Une catégorie ne peut pas être son propre parent', 422);
        if ($parentId !== null) {
            if (!$categoryModel->findById($parentId)) apiError('Catégorie parente introuvable', 422);
            if ($categoryModel->isDescendant($parentId, $id)) apiError('Impossible de déplacer une catégorie dans elle-même', 422);
        }
        $payload['parent_id'] = $parentId;
    }

    if (array_key_exists('target_audience', $data)) {
        if (!in_array($data['target_audience'], $validAudiences, true)) apiError('Public cible invalide', 422);
        $payload['target_audience'] = $data['target_audience'];
    }

    if (array_key_exists('image', $data)) {
        $payload['image'] = sanitizeText($data['image'], 500);
    }
    if (array_key_exists('sort_order', $data)) {
        $payload['sort_order'] = (int) $data['sort_order'];
    }
    if (array_key_exists('is_active', $data)) {
        $payload['is_active'] = boolFromInput($data['is_active']);
    }

    if (array_key_exists('name', $payload) || array_key_exists('slug', $data)) {
        $source = !empty($data['slug']) ? slugify((string) $data['slug']) : slugify((string) ($payload['name'] ?? $existing['name']));
        $payload['slug'] = $categoryModel->uniqueSlug($source, $id);
    }

    $categoryModel->update($id, $payload);

    apiSuccess('Catégorie mise à jour', ['category' => $categoryModel->findById($id)]);
}

// -------------------------------------------------------------------------
// DELETE
// -------------------------------------------------------------------------
if ($method === 'DELETE') {
    requireAdmin();
    if (!$id) apiError('ID requis');

    $category = $categoryModel->findById($id);
    if (!$category) apiError('Catégorie non trouvée', 404);

    $productCount = $categoryModel->countProducts($id);
    if ($productCount > 0) {
        apiError("Impossible de supprimer : {$productCount} produit(s) utilisent cette catégorie. Déplacez-les d'abord.", 409, ['product_count' => $productCount]);
    }

    $childIds = $categoryModel->childIds($id);
    foreach ($childIds as $childId) {
        $categoryModel->delete($childId);
    }

    if (!empty($category['image']) && strpos($category['image'], 'uploads/') !== false) {
        $absolute = dirname(__DIR__, 3) . '/public/uploads/categories/' . basename($category['image']);
        if (is_file($absolute)) @unlink($absolute);
    }

    $categoryModel->delete($id);

    apiSuccess('Catégorie supprimée', ['deleted_children' => count($childIds)]);
}

apiError('Endpoint non trouvé', 404);
