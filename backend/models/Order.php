<?php
// =============================================================================
// ALTESS FASHION — Model Commande
// =============================================================================

class Order
{
    public const STATUSES = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];

    public const STATUS_LABELS = [
        'pending'   => 'En attente',
        'confirmed' => 'Confirmée',
        'preparing' => 'En préparation',
        'shipped'   => 'Expédiée',
        'delivered' => 'Livrée',
        'cancelled' => 'Annulée',
    ];

    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT o.*, u.firstname, u.lastname, u.email, u.phone FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        if ($order) {
            $order['items'] = $this->getItems($id);
        }
        return $order;
    }

    public function findByNumber(string $orderNumber): ?array
    {
        $stmt = $this->pdo->prepare('SELECT o.*, u.firstname, u.lastname, u.email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.order_number = :order_number LIMIT 1');
        $stmt->execute([':order_number' => $orderNumber]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        if ($order) {
            $order['items'] = $this->getItems((int) $order['id']);
        }
        return $order;
    }

    public function getByUser(int $userId, array $filters = []): array
    {
        $sql = 'SELECT * FROM orders WHERE user_id = :user_id';
        $params = [':user_id' => $userId];
        if (!empty($filters['status']) && in_array($filters['status'], self::STATUSES, true)) {
            $sql .= ' AND status = :status';
            $params[':status'] = $filters['status'];
        }
        $sql .= ' ORDER BY created_at DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAll(array $filters = []): array
    {
        $sql = 'SELECT o.*, u.firstname, u.lastname, u.email, u.phone, '
             . '(SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count '
             . 'FROM orders o JOIN users u ON o.user_id = u.id WHERE 1=1';
        $params = [];

        if (!empty($filters['status']) && in_array($filters['status'], self::STATUSES, true)) {
            $sql .= ' AND o.status = :status';
            $params[':status'] = $filters['status'];
        }
        if (!empty($filters['search'])) {
            $sql .= ' AND (o.order_number LIKE :search OR u.firstname LIKE :search OR u.lastname LIKE :search OR u.email LIKE :search)';
            $params[':search'] = '%' . $filters['search'] . '%';
        }
        if (!empty($filters['from'])) {
            $sql .= ' AND o.created_at >= :from';
            $params[':from'] = $filters['from'] . ' 00:00:00';
        }
        if (!empty($filters['to'])) {
            $sql .= ' AND o.created_at <= :to';
            $params[':to'] = $filters['to'] . ' 23:59:59';
        }

        $sql .= ' ORDER BY o.created_at DESC';

        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = (int) ($filters['per_page'] ?? 20);
        $perPage = max(1, min(100, $perPage));
        $sql .= ' LIMIT :offset, :limit';
        $params[':offset'] = ($page - 1) * $perPage;
        $params[':limit'] = $perPage;

        $stmt = $this->pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function countAll(array $filters = []): int
    {
        $sql = 'SELECT COUNT(*) FROM orders o JOIN users u ON o.user_id = u.id WHERE 1=1';
        $params = [];

        if (!empty($filters['status']) && in_array($filters['status'], self::STATUSES, true)) {
            $sql .= ' AND o.status = :status';
            $params[':status'] = $filters['status'];
        }
        if (!empty($filters['search'])) {
            $sql .= ' AND (o.order_number LIKE :search OR u.firstname LIKE :search OR u.lastname LIKE :search OR u.email LIKE :search)';
            $params[':search'] = '%' . $filters['search'] . '%';
        }
        if (!empty($filters['from'])) {
            $sql .= ' AND o.created_at >= :from';
            $params[':from'] = $filters['from'] . ' 00:00:00';
        }
        if (!empty($filters['to'])) {
            $sql .= ' AND o.created_at <= :to';
            $params[':to'] = $filters['to'] . ' 23:59:59';
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn();
    }

    public function getItems(int $orderId): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM order_items WHERE order_id = :order_id ORDER BY id ASC');
        $stmt->execute([':order_id' => $orderId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create(int $userId, array $items, array $data): int
    {
        $orderNumber = $this->generateOrderNumber();
        $stmt = $this->pdo->prepare('INSERT INTO orders (order_number, user_id, status, payment_method, subtotal, total, shipping_address, notes) VALUES (:order_number, :user_id, :status, :payment_method, :subtotal, :total, :shipping_address, :notes)');
        $stmt->execute([
            'order_number'     => $orderNumber,
            'user_id'          => $userId,
            'status'           => 'pending',
            'payment_method'   => $data['payment_method'] ?? 'cash_on_delivery',
            'subtotal'         => $data['subtotal'],
            'total'            => $data['total'],
            'shipping_address' => $data['shipping_address'],
            'notes'            => $data['notes'] ?? null,
        ]);
        $orderId = (int) $this->pdo->lastInsertId();

        $stmtItem = $this->pdo->prepare('INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, size, color, unit_price, subtotal) VALUES (:order_id, :product_id, :product_name, :product_image, :quantity, :size, :color, :unit_price, :subtotal)');
        foreach ($items as $item) {
            $stmtItem->execute([
                'order_id'      => $orderId,
                'product_id'    => $item['product_id'],
                'product_name'  => $item['product_name'],
                'product_image' => $item['product_image'] ?? null,
                'quantity'      => $item['quantity'],
                'size'          => $item['size'] ?? null,
                'color'         => $item['color'] ?? null,
                'unit_price'    => $item['unit_price'],
                'subtotal'      => $item['subtotal'],
            ]);
        }
        return $orderId;
    }

    private function generateOrderNumber(): string
    {
        do {
            $candidate = 'ALT-' . date('ymd') . str_pad((string) mt_rand(1000, 9999), 4, '0', STR_PAD_LEFT);
            $check = $this->pdo->prepare('SELECT COUNT(*) FROM orders WHERE order_number = :n');
            $check->execute([':n' => $candidate]);
        } while ((int) $check->fetchColumn() > 0);
        return $candidate;
    }

    public function updateStatus(int $id, string $status): bool
    {
        if (!in_array($status, self::STATUSES, true)) return false;
        if (!$this->findById($id)) return false;
        $stmt = $this->pdo->prepare('UPDATE orders SET status = :status, updated_at = NOW() WHERE id = :id');
        return $stmt->execute([':status' => $status, ':id' => $id]);
    }

    public function update(int $id, array $data): bool
    {
        if (!$this->findById($id)) return false;

        $fields = [];
        $params = [':id' => $id];

        if (array_key_exists('shipping_address', $data)) {
            $fields[] = 'shipping_address = :shipping_address';
            $params[':shipping_address'] = $data['shipping_address'];
        }
        if (array_key_exists('notes', $data)) {
            $fields[] = 'notes = :notes';
            $params[':notes'] = $data['notes'] !== '' ? $data['notes'] : null;
        }
        if (array_key_exists('payment_method', $data)) {
            $fields[] = 'payment_method = :payment_method';
            $params[':payment_method'] = $data['payment_method'];
        }
        if (array_key_exists('status', $data) && in_array($data['status'], self::STATUSES, true)) {
            $fields[] = 'status = :status';
            $params[':status'] = $data['status'];
        }

        if (empty($fields)) return true;
        $fields[] = 'updated_at = NOW()';

        $stmt = $this->pdo->prepare('UPDATE orders SET ' . implode(', ', $fields) . ' WHERE id = :id');
        return $stmt->execute($params);
    }

    public function getStats(): array
    {
        $stats = [];

        $stmt = $this->pdo->query('SELECT COUNT(*) FROM products WHERE stock = 0 AND is_active = 1');
        $stats['out_of_stock'] = (int) $stmt->fetchColumn();

        $stmt = $this->pdo->query('SELECT COUNT(*) FROM orders WHERE status IN ("pending","confirmed","preparing")');
        $stats['active_orders'] = (int) $stmt->fetchColumn();

        $stmt = $this->pdo->query('SELECT COALESCE(SUM(total),0) FROM orders WHERE status != "cancelled"');
        $stats['revenue'] = (float) $stmt->fetchColumn();

        $stmt = $this->pdo->query('SELECT COUNT(*) FROM orders');
        $stats['total_orders'] = (int) $stmt->fetchColumn();

        $stmt = $this->pdo->query('SELECT status, COUNT(*) as n FROM orders GROUP BY status');
        $byStatus = array_fill_keys(self::STATUSES, 0);
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $byStatus[$row['status']] = (int) $row['n'];
        }
        $stats['orders_by_status'] = $byStatus;

        $stmt = $this->pdo->query('SELECT COUNT(*) FROM users WHERE role = "customer"');
        $stats['customers'] = (int) $stmt->fetchColumn();

        $stmt = $this->pdo->query('SELECT COUNT(*) FROM products');
        $stats['products'] = (int) $stmt->fetchColumn();

        $stmt = $this->pdo->query('SELECT COUNT(*) FROM products WHERE is_active = 1');
        $stats['active_products'] = (int) $stmt->fetchColumn();

        $stmt = $this->pdo->query('SELECT COUNT(*) FROM products WHERE is_active = 1 AND stock <= 5');
        $stats['low_stock'] = (int) $stmt->fetchColumn();

        $stmt = $this->pdo->query('SELECT COUNT(*) FROM categories');
        $stats['categories'] = (int) $stmt->fetchColumn();

        return $stats;
    }

    public function getRevenueByMonth(int $months = 6): array
    {
        $stmt = $this->pdo->prepare('SELECT DATE_FORMAT(created_at, "%Y-%m") as ym, COALESCE(SUM(total),0) as total, COUNT(*) as n FROM orders WHERE status != "cancelled" AND created_at >= DATE_SUB(CURDATE(), INTERVAL :months MONTH) GROUP BY ym ORDER BY ym ASC');
        $stmt->bindValue(':months', $months, PDO::PARAM_INT);
        $stmt->execute();

        $rows = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $rows[$row['ym']] = ['total' => (float) $row['total'], 'orders' => (int) $row['n']];
        }

        $series = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $ym = date('Y-m', strtotime("-{$i} months"));
            $series[] = [
                'month'  => $ym,
                'label'  => date('M y', strtotime($ym . '-01')),
                'total'  => $rows[$ym]['total'] ?? 0,
                'orders' => $rows[$ym]['orders'] ?? 0,
            ];
        }
        return $series;
    }

    public function getTopProducts(int $limit = 5): array
    {
        $stmt = $this->pdo->prepare('SELECT oi.product_id, oi.product_name, SUM(oi.quantity) as qty, SUM(oi.subtotal) as revenue FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.status != "cancelled" GROUP BY oi.product_id, oi.product_name ORDER BY qty DESC LIMIT :limit');
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getRecent(int $limit = 8): array
    {
        $stmt = $this->pdo->prepare('SELECT o.*, u.firstname, u.lastname FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT :limit');
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
