<?php
// =============================================================================
// ALTESS FASHION — API Panier
// =============================================================================

require_once __DIR__ . '/../../index.php';
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Cart.php';
require_once __DIR__ . '/../../models/Product.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$db = getDB();
$cartModel = new Cart($db);
$productModel = new Product($db);

$method = $_SERVER['REQUEST_METHOD'];
$userId = currentUserId();

if (!$userId) {
    if ($method === 'GET') apiJson(['items' => [], 'cart_id' => null, 'subtotal' => 0, 'total_items' => 0]);
    apiError('Authentification requise', 401);
}

$cartId = $cartModel->getOrCreate($userId);

function cartPayload(Cart $cartModel, int $cartId): array
{
    $items = $cartModel->getItems($cartId);
    $subtotal = 0;
    $count = 0;
    foreach ($items as $item) {
        $subtotal += (float) $item['price'] * (int) $item['quantity'];
        $count += (int) $item['quantity'];
    }
    return ['cart_id' => $cartId, 'items' => $items, 'subtotal' => $subtotal, 'total_items' => $count];
}

if ($method === 'GET') {
    apiJson(cartPayload($cartModel, $cartId));
}

if ($method === 'POST') {
    $data = readJsonBody();
    $productId = (int) ($data['product_id'] ?? 0);
    $quantity = max(1, (int) ($data['quantity'] ?? 1));
    $size = sanitizeText($data['size'] ?? null, 20);
    $color = sanitizeText($data['color'] ?? null, 50);

    $product = $productModel->findById($productId);
    if (!$product) apiError('Produit introuvable', 404);
    if ((int) $product['is_active'] !== 1) apiError('Produit indisponible', 409);
    if ((int) $product['stock'] < $quantity) apiError('Stock insuffisant', 409);

    $existing = $cartModel->getItem($cartId, $productId, $size, $color);
    if ($existing) {
        $newQty = (int) $existing['quantity'] + $quantity;
        if ($newQty > (int) $product['stock']) apiError('Stock insuffisant', 409);
        $cartModel->updateItemQuantity((int) $existing['id'], $newQty);
    } else {
        $cartModel->addItem($cartId, [
            'product_id' => $productId,
            'quantity'   => $quantity,
            'size'       => $size,
            'color'      => $color,
            'price'      => (float) $product['price'],
        ]);
    }

    apiSuccess('Article ajouté au panier', cartPayload($cartModel, $cartId));
}

if ($method === 'PUT' || $method === 'PATCH') {
    $data = readJsonBody();
    $itemId = (int) ($data['item_id'] ?? 0);
    $quantity = (int) ($data['quantity'] ?? 1);

    $items = $cartModel->getItems($cartId);
    $target = null;
    foreach ($items as $item) {
        if ((int) $item['id'] === $itemId) { $target = $item; break; }
    }
    if (!$target) apiError('Article introuvable dans le panier', 404);

    if ($quantity > 0) {
        $product = $productModel->findById((int) $target['product_id']);
        if ($product && $quantity > (int) $product['stock']) apiError('Stock insuffisant', 409);
    }

    $cartModel->updateItemQuantity($itemId, $quantity);
    apiSuccess('Panier mis à jour', cartPayload($cartModel, $cartId));
}

if ($method === 'DELETE') {
    $data = readJsonBody();
    $itemId = (int) ($data['item_id'] ?? $_GET['item_id'] ?? 0);

    if (!$itemId) {
        $cartModel->clear($cartId);
        apiSuccess('Panier vidé', cartPayload($cartModel, $cartId));
    }

    $items = $cartModel->getItems($cartId);
    $found = false;
    foreach ($items as $item) {
        if ((int) $item['id'] === $itemId) { $found = true; break; }
    }
    if (!$found) apiError('Article introuvable dans le panier', 404);

    $cartModel->removeItem($itemId);
    apiSuccess('Article retiré', cartPayload($cartModel, $cartId));
}

apiError('Méthode non autorisée', 405);
