<?php
// =============================================================================
// ALTESS FASHION — Model Panier
// =============================================================================

class Cart
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getOrCreate(int $userId): int
    {
        $stmt = $this->pdo->prepare('SELECT id FROM carts WHERE user_id = :user_id LIMIT 1');
        $stmt->execute([':user_id' => $userId]);
        $row = $stmt->fetch();
        if ($row) return (int) $row['id'];

        $stmt = $this->pdo->prepare('INSERT INTO carts (user_id) VALUES (:user_id)');
        $stmt->execute([':user_id' => $userId]);
        return (int) $this->pdo->lastInsertId();
    }

    public function getItems(int $cartId): array
    {
        $stmt = $this->pdo->prepare('SELECT ci.*, p.name, p.slug, p.price as product_price FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = :cart_id');
        $stmt->execute([':cart_id' => $cartId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function addItem(int $cartId, array $data): bool
    {
        $stmt = $this->pdo->prepare('INSERT INTO cart_items (cart_id, product_id, quantity, size, color, price) VALUES (:cart_id, :product_id, :quantity, :size, :color, :price)');
        return $stmt->execute([
            ':cart_id'    => $cartId,
            ':product_id' => $data['product_id'],
            ':quantity'   => $data['quantity'],
            ':size'       => $data['size'] ?? null,
            ':color'      => $data['color'] ?? null,
            ':price'      => $data['price'],
        ]);
    }

    public function getItem(int $cartId, int $productId, ?string $size, ?string $color): ?array
    {
        $sql = 'SELECT * FROM cart_items WHERE cart_id = :cart_id AND product_id = :product_id';
        $params = [':cart_id' => $cartId, ':product_id' => $productId];
        if ($size) {
            $sql .= ' AND (size IS NULL OR size = :size OR size = :size2)';
            $params[':size'] = $size;
            $params[':size2'] = $size;
        }
        if ($color) {
            $sql .= ' AND (color IS NULL OR color = :color)';
            $params[':color'] = $color;
        }
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function updateItemQuantity(int $itemId, int $quantity): bool
    {
        if ($quantity <= 0) return $this->removeItem($itemId);
        $stmt = $this->pdo->prepare('UPDATE cart_items SET quantity = :quantity WHERE id = :id');
        return $stmt->execute([':quantity' => $quantity, ':id' => $itemId]);
    }

    public function removeItem(int $itemId): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM cart_items WHERE id = :id');
        return $stmt->execute([':id' => $itemId]);
    }

    public function clear(int $cartId): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM cart_items WHERE cart_id = :cart_id');
        return $stmt->execute([':cart_id' => $cartId]);
    }
}