<?php
// =============================================================================
// ALTESS FASHION — API Commandes
// =============================================================================

require_once __DIR__ . '/../../index.php';
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Order.php';
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
$orderModel = new Order($db);
$cartModel = new Cart($db);
$productModel = new Product($db);

$method = $_SERVER['REQUEST_METHOD'];
$id = queryInt($_GET['id'] ?? null);

// -------------------------------------------------------------------------
// POST : créer une commande
// -------------------------------------------------------------------------
if ($method === 'POST') {
    requireAuth();
    $userId = currentUserId();

    $data = readJsonBody();
    if (empty($data['items']) || !is_array($data['items'])) apiError('Articles requis', 422);
    if (empty($data['shipping_address'])) apiError('Adresse de livraison requise', 422);

    $subtotal = 0;
    $items = [];

    foreach ($data['items'] as $item) {
        $productId = (int) ($item['product_id'] ?? 0);
        $quantity = max(1, (int) ($item['quantity'] ?? 1));
        if (!$productId) continue;

        $product = $productModel->findById($productId);
        if (!$product) apiError("Produit #{$productId} introuvable", 422);
        if ((int) $product['is_active'] !== 1) apiError("Le produit « {$product['name']} » n'est plus disponible", 422);
        if ((int) $product['stock'] < $quantity) apiError("Stock insuffisant pour « {$product['name']} »", 409);

        // Le prix vient toujours de la BDD, jamais du client
        $unitPrice = (float) $product['price'];
        $lineTotal = $unitPrice * $quantity;
        $subtotal += $lineTotal;

        $images = $product['images'] ?? [];
        $items[] = [
            'product_id'   => $productId,
            'product_name' => $product['name'],
            'product_image'=> $images[0]['image_path'] ?? null,
            'quantity'     => $quantity,
            'size'         => sanitizeText($item['size'] ?? null, 20),
            'color'        => sanitizeText($item['color'] ?? null, 50),
            'unit_price'   => $unitPrice,
            'subtotal'     => $lineTotal,
        ];
    }

    if (empty($items)) apiError('Aucun article valide dans la commande', 422);

    $shipping = (float) ($data['shipping'] ?? 0);
    $total = $subtotal + $shipping;

    $orderId = $orderModel->create($userId, $items, [
        'subtotal'         => $subtotal,
        'total'            => $total,
        'shipping_address' => sanitizeText($data['shipping_address'], 1000),
        'notes'            => sanitizeText($data['notes'] ?? null, 1000),
        'payment_method'   => in_array($data['payment_method'] ?? '', ['cash_on_delivery', 'mobile_money', 'bank_transfer'], true)
            ? $data['payment_method']
            : 'cash_on_delivery',
    ]);

    // Décrément du stock
    foreach ($items as $item) {
        $productModel->adjustStock($item['product_id'], -$item['quantity']);
    }

    if (!empty($data['cart_id'])) {
        $cartModel->clear((int) $data['cart_id']);
    }

    $order = $orderModel->findById($orderId);
    apiSuccess('Commande enregistrée', ['order' => $order, 'order_number' => $order['order_number']], 201);
}

// -------------------------------------------------------------------------
// GET
// -------------------------------------------------------------------------
if ($method === 'GET') {
    $admin = isAdmin();
    $wantsAll = !empty($_GET['all']) || $admin;

    if ($id) {
        if ($admin) {
            $order = $orderModel->findById($id);
        } else {
            requireAuth();
            $order = $orderModel->findById($id);
            if ($order && (int) $order['user_id'] !== currentUserId()) {
                apiError('Accès refusé', 403);
            }
        }
        if (!$order) apiError('Commande non trouvée', 404);
        apiJson(['order' => $order]);
    }

    if (!empty($_GET['number'])) {
        $order = $orderModel->findByNumber((string) $_GET['number']);
        if (!$order) apiError('Commande non trouvée', 404);
        apiJson(['order' => $order]);
    }

    if ($wantsAll) {
        requireAdmin();
        $filters = [];
        foreach (['status', 'search', 'from', 'to'] as $key) {
            if (!empty($_GET[$key])) $filters[$key] = $_GET[$key];
        }
        $filters['page'] = (int) ($_GET['page'] ?? 1);
        $perPage = max(1, min(100, (int) ($_GET['per_page'] ?? 20)));
        $filters['per_page'] = $perPage;

        $total = $orderModel->countAll($filters);
        apiJson([
            'orders'   => $orderModel->getAll($filters),
            'total'    => $total,
            'page'     => $filters['page'],
            'per_page' => $perPage,
            'pages'    => (int) ceil($total / $perPage),
            'statuses' => Order::STATUS_LABELS,
        ]);
    }

    requireAuth();
    $page = max(1, (int) ($_GET['page'] ?? 1));
    $perPage = max(1, min(100, (int) ($_GET['per_page'] ?? 8)));
    $filters = [
        'status' => $_GET['status'] ?? null,
        'page' => $page,
        'per_page' => $perPage,
    ];
    $total = $orderModel->countByUser(currentUserId(), $filters);
    apiJson([
        'orders'   => $orderModel->getByUser(currentUserId(), $filters),
        'total'    => $total,
        'page'     => $page,
        'per_page' => $perPage,
        'pages'    => (int) ceil($total / $perPage),
    ]);
}

// -------------------------------------------------------------------------
// PUT / PATCH
// -------------------------------------------------------------------------
if ($method === 'PUT' || $method === 'PATCH') {
    requireAdmin();
    if (!$id) apiError('ID requis');

    $order = $orderModel->findById($id);
    if (!$order) apiError('Commande non trouvée', 404);

    $data = readJsonBody();
    $updated = $orderModel->update($id, $data);

    if (!$updated) apiError('Aucune modification valide', 422);

    $fresh = $orderModel->findById($id);

    // Restitution du stock si la commande repasse en attente/annulée
    $wasCancelled = $order['status'] === 'cancelled';
    $isCancelled = ($fresh['status'] ?? '') === 'cancelled';
    if ($wasCancelled !== $isCancelled) {
        $factor = $isCancelled ? 1 : -1;
        foreach ($fresh['items'] as $item) {
            $productModel->adjustStock((int) $item['product_id'], $factor * (int) $item['quantity']);
        }
    }

    apiSuccess('Commande mise à jour', ['order' => $orderModel->findById($id)]);
}

// -------------------------------------------------------------------------
// DELETE
// -------------------------------------------------------------------------
if ($method === 'DELETE') {
    requireAdmin();
    if (!$id) apiError('ID requis');
    $order = $orderModel->findById($id);
    if (!$order) apiError('Commande non trouvée', 404);
    if ($order['status'] !== 'cancelled') {
        apiError('Annulez la commande avant de la supprimer', 409);
    }
    apiError("Suppression définitive désactivée pour préserver l'historique des ventes. Annulez la commande.", 409);
}

apiError('Endpoint non trouvé', 404);
