<?php
// =============================================================================
// ALTESS FASHION — API Products (CRUD admin complet)
// =============================================================================

require_once __DIR__ . '/../../index.php';
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Product.php';
require_once __DIR__ . '/../../models/Category.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$db = getDB();
$productModel = new Product($db);
$categoryModel = new Category($db);

$method = $_SERVER['REQUEST_METHOD'];
$id = queryInt($_GET['id'] ?? null);

$validGenders = ['female', 'male', 'unisex'];

function validateProductInput(array $data, array $validGenders, bool $partial): array
{
    $errors = [];

    if (!$partial || array_key_exists('name', $data)) {
        $name = sanitizeText($data['name'] ?? null, 255);
        if (!$name) $errors[] = 'Le nom est requis';
    }
    if (!$partial || array_key_exists('price', $data)) {
        $price = $data['price'] ?? null;
        if ($price === '' || $price === null || !is_numeric($price)) {
            $errors[] = 'Le prix est requis et doit être un nombre';
        } elseif ((float) $price < 0) {
            $errors[] = 'Le prix ne peut pas être négatif';
        }
    }
    if (!$partial || array_key_exists('category_id', $data)) {
        $categoryId = $data['category_id'] ?? null;
        if (!$categoryId || !is_numeric($categoryId)) {
            $errors[] = 'La catégorie est requise';
        }
    }
    if (array_key_exists('gender', $data) && !in_array($data['gender'], $validGenders, true)) {
        $errors[] = 'Public cible invalide';
    }
    if (array_key_exists('stock', $data) && (!is_numeric($data['stock']) || (int) $data['stock'] < 0)) {
        $errors[] = 'Le stock doit être un entier positif';
    }
    if (array_key_exists('old_price', $data) && $data['old_price'] !== '' && $data['old_price'] !== null) {
        if (!is_numeric($data['old_price'])) {
            $errors[] = 'L\'ancien prix doit être un nombre';
        } elseif (isset($data['price']) && is_numeric($data['price']) && (float) $data['old_price'] <= (float) $data['price']) {
            $errors[] = 'L\'ancien prix doit être supérieur au prix de vente';
        }
    }

    return $errors;
}

// -------------------------------------------------------------------------
// GET
// -------------------------------------------------------------------------
if ($method === 'GET') {
    if (!empty($_GET['slug']) && !$id) {
        $product = $productModel->findBySlug((string) $_GET['slug']);
        if (!$product) apiError('Produit non trouvé', 404);
        apiJson(['product' => $product]);
    }

    if ($id) {
        $product = $productModel->findById($id);
        if (!$product) apiError('Produit non trouvé', 404);
        apiJson(['product' => $product]);
    }

    $filters = [];
    foreach (['gender', 'category_id', 'subcategory_id', 'search', 'page', 'per_page', 'sort'] as $key) {
        if (!empty($_GET[$key])) $filters[$key] = $_GET[$key];
    }
    foreach (['is_active', 'is_promo', 'in_stock'] as $key) {
        if (isset($_GET[$key]) && $_GET[$key] !== '') $filters[$key] = (int) $_GET[$key];
    }
    if (!empty($_GET['min_price'])) $filters['min_price'] = $_GET['min_price'];
    if (!empty($_GET['max_price'])) $filters['max_price'] = $_GET['max_price'];

    $page = max(1, (int) ($filters['page'] ?? 1));
    $perPage = (int) ($filters['per_page'] ?? 20);
    $perPage = max(1, min(200, $perPage));
    $filters['per_page'] = $perPage;

    $total = $productModel->countAll($filters);
    $products = $productModel->getAll($filters);

    apiJson([
        'products'  => $products,
        'total'     => $total,
        'page'      => $page,
        'per_page'  => $perPage,
        'pages'     => (int) ceil($total / $perPage),
    ]);
}

// -------------------------------------------------------------------------
// POST
// -------------------------------------------------------------------------
if ($method === 'POST') {
    requireAdmin();

    $data = readJsonBody();
    $errors = validateProductInput($data, $validGenders, false);
    if ($errors) apiError(implode('. ', $errors), 422, ['errors' => $errors]);

    $categoryId = (int) $data['category_id'];
    $category = $categoryModel->findById($categoryId);
    if (!$category) apiError('Catégorie introuvable', 422);

    // subcategory_id est dérivé du parent de la catégorie choisie : le client
    // ne peut pas désynchroniser les deux champs. Si l'admin a choisi une
    // racine, celle-ci devient le parent pour rester cohérente.
    $subcategoryId = $category['parent_id'] ? (int) $category['parent_id'] : null;
    if ($subcategoryId === null) {
        $subcategoryId = !empty($data['subcategory_id']) ? (int) $data['subcategory_id'] : null;
    }
    if ($subcategoryId && !$categoryModel->findById($subcategoryId)) $subcategoryId = null;

    $slugSource = !empty($data['slug']) ? slugify((string) $data['slug']) : slugify((string) $data['name']);
    $slug = $productModel->uniqueSlug($slugSource);

    $payload = [
        'name'              => sanitizeText($data['name'], 255),
        'slug'              => $slug,
        'description'       => sanitizeText($data['description'] ?? null, 5000),
        'short_description' => sanitizeText($data['short_description'] ?? null, 500),
        'category_id'       => $categoryId,
        'subcategory_id'    => $subcategoryId,
        'gender'            => in_array($data['gender'] ?? '', $validGenders, true) ? $data['gender'] : 'unisex',
        'price'             => (float) $data['price'],
        'old_price'         => isset($data['old_price']) && $data['old_price'] !== '' ? (float) $data['old_price'] : null,
        'stock'             => max(0, (int) ($data['stock'] ?? 0)),
        'is_active'         => array_key_exists('is_active', $data) ? boolFromInput($data['is_active']) : 1,
        'is_promo'          => boolFromInput($data['is_promo'] ?? 0),
        'meta_title'        => sanitizeText($data['meta_title'] ?? null, 255),
        'meta_description'  => sanitizeText($data['meta_description'] ?? null, 500),
    ];

    $productId = $productModel->create($payload);

    if (isset($data['variants']) && is_array($data['variants'])) {
        $productModel->saveVariants($productId, $data['variants']);
    }
    if (isset($data['images']) && is_array($data['images'])) {
        foreach (array_slice($data['images'], 0, 8) as $i => $imagePath) {
            if (is_string($imagePath) && trim($imagePath) !== '') {
                $productModel->addImage($productId, trim($imagePath), null, $i);
            }
        }
    }

    apiSuccess('Produit créé', [
        'id'      => $productId,
        'slug'    => $slug,
        'product' => $productModel->findById($productId),
    ], 201);
}

// -------------------------------------------------------------------------
// PUT / PATCH
// -------------------------------------------------------------------------
if ($method === 'PUT' || $method === 'PATCH') {
    requireAdmin();
    if (!$id) apiError('ID requis');

    if (!$productModel->findById($id)) apiError('Produit non trouvé', 404);

    $data = readJsonBody();
    $errors = validateProductInput($data, $validGenders, true);
    if ($errors) apiError(implode('. ', $errors), 422, ['errors' => $errors]);

    $payload = [];

    $stringFields = ['name', 'description', 'short_description', 'meta_title', 'meta_description'];
    foreach ($stringFields as $field) {
        if (array_key_exists($field, $data)) {
            $payload[$field] = sanitizeText($data[$field], $field === 'description' ? 5000 : 500);
        }
    }

    if (array_key_exists('category_id', $data) || array_key_exists('subcategory_id', $data)) {
        $current = $productModel->findById($id);
        $categoryId = array_key_exists('category_id', $data)
            ? (int) $data['category_id']
            : (int) $current['category_id'];
        $category = $categoryModel->findById($categoryId);
        if (!$category) apiError('Catégorie introuvable', 422);

        $payload['category_id'] = $categoryId;
        // Le parent est toujours dérivé de la catégorie, jamais accepté tel quel.
        $payload['subcategory_id'] = $category['parent_id'] ? (int) $category['parent_id'] : null;
    }
    if (array_key_exists('gender', $data) && in_array($data['gender'], $validGenders, true)) {
        $payload['gender'] = $data['gender'];
    }
    if (array_key_exists('price', $data)) $payload['price'] = (float) $data['price'];
    if (array_key_exists('old_price', $data)) {
        $payload['old_price'] = ($data['old_price'] === '' || $data['old_price'] === null) ? null : (float) $data['old_price'];
    }
    if (array_key_exists('stock', $data)) $payload['stock'] = max(0, (int) $data['stock']);
    if (array_key_exists('is_active', $data)) $payload['is_active'] = boolFromInput($data['is_active']);
    if (array_key_exists('is_promo', $data)) $payload['is_promo'] = boolFromInput($data['is_promo']);

    if (array_key_exists('name', $payload) || array_key_exists('slug', $data)) {
        $slugSource = !empty($data['slug']) ? slugify((string) $data['slug']) : slugify((string) ($payload['name'] ?? $data['name'] ?? ''));
        $payload['slug'] = $productModel->uniqueSlug($slugSource, $id);
    }

    $productModel->update($id, $payload);

    if (isset($data['variants']) && is_array($data['variants'])) {
        $productModel->saveVariants($id, $data['variants']);
    }

    apiSuccess('Produit mis à jour', ['product' => $productModel->findById($id)]);
}

// -------------------------------------------------------------------------
// DELETE
// -------------------------------------------------------------------------
if ($method === 'DELETE') {
    requireAdmin();
    if (!$id) apiError('ID requis');
    if (!$productModel->findById($id)) apiError('Produit non trouvé', 404);

    // Un produit déjà commandé ne peut pas être supprimé : l'historique des
    // commandes doit rester cohérent. On l'explique plutôt qu'une erreur 500.
    if ($productModel->countOrderItems($id) > 0) {
        apiError(
            'Ce produit apparaît dans des commandes existantes. Désactivez-le pour le retirer de la boutique tout en conservant l\'historique.',
            409,
            ['order_count' => $productModel->countOrderItems($id)]
        );
    }

    $productModel->delete($id);
    apiSuccess('Produit supprimé');
}

apiError('Endpoint non trouvé', 404);
