<?php
// =============================================================================
// ALTESS FASHION — API Stats (admin)
// =============================================================================

require_once __DIR__ . '/../../index.php';
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Order.php';
require_once __DIR__ . '/../../models/Product.php';
require_once __DIR__ . '/../../models/Category.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    apiError('Méthode non autorisée', 405);
}

$db = getDB();
$orderModel = new Order($db);
$productModel = new Product($db);
$categoryModel = new Category($db);

$stats = $orderModel->getStats();
$stats['revenue_by_month'] = $orderModel->getRevenueByMonth(6);
$stats['top_products'] = $orderModel->getTopProducts(5);
$stats['recent_orders'] = $orderModel->getRecent(8);
$stats['low_stock_products'] = $productModel->getLowStock(8);
$stats['pending_orders_count'] = $stats['orders_by_status']['pending'] ?? 0;
$stats['average_order_value'] = $stats['total_orders'] > 0
    ? round($stats['revenue'] / $stats['total_orders'], 2)
    : 0.0;

apiJson([
    'stats'      => $stats,
    'generated_at' => date('c'),
]);
