<?php
// =============================================================================
// ALTESS FASHION — Model Utilisateur
// =============================================================================

class User
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT id, lastname, firstname, email, phone, address, role, is_active, created_at, updated_at FROM users WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->pdo->prepare('SELECT id, lastname, firstname, email, phone, password, address, role, is_active, created_at, updated_at FROM users WHERE email = :email LIMIT 1');
        $stmt->execute([':email' => $email]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare('INSERT INTO users (lastname, firstname, email, phone, password, address, role) VALUES (:lastname, :firstname, :email, :phone, :password, :address, :role)');
        $stmt->execute([
            'lastname'  => $data['lastname'],
            'firstname' => $data['firstname'],
            'email'     => $data['email'],
            'phone'     => $data['phone'] ?? null,
            'password'  => $data['password'],
            'address'   => $data['address'] ?? null,
            'role'      => $data['role'] ?? 'customer',
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        if (!$this->findById($id)) return false;

        $fields = [];
        $params = [':id' => $id];

        foreach (['lastname', 'firstname', 'email', 'phone', 'address'] as $field) {
            if (!array_key_exists($field, $data)) continue;
            $fields[] = "$field = :$field";
            $params[":$field"] = ($data[$field] === '') ? null : $data[$field];
        }

        if (array_key_exists('role', $data)) {
            $role = $data['role'] === 'admin' ? 'admin' : 'customer';
            $fields[] = 'role = :role';
            $params[':role'] = $role;
        }

        if (array_key_exists('is_active', $data)) {
            $fields[] = 'is_active = :is_active';
            $params[':is_active'] = $data['is_active'] ? 1 : 0;
        }

        if (!empty($data['password'])) {
            $fields[] = 'password = :password';
            $params[':password'] = $data['password'];
        }

        if (empty($fields)) return true;

        $stmt = $this->pdo->prepare('UPDATE users SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE id = :id');
        return $stmt->execute($params);
    }

    public function getAll(?string $search = null, ?string $role = null, ?int $limit = 200): array
    {
        $sql = 'SELECT u.id, u.lastname, u.firstname, u.email, u.phone, u.role, u.is_active, u.created_at, '
             . '(SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) as order_count, '
             . '(SELECT COALESCE(SUM(o.total),0) FROM orders o WHERE o.user_id = u.id AND o.status != "cancelled") as total_spent '
             . 'FROM users u WHERE 1=1';
        $params = [];

        if (!empty($search)) {
            $sql .= ' AND (u.firstname LIKE :search OR u.lastname LIKE :search OR u.email LIKE :search)';
            $params[':search'] = '%' . $search . '%';
        }
        if (!empty($role) && in_array($role, ['admin', 'customer'], true)) {
            $sql .= ' AND u.role = :role';
            $params[':role'] = $role;
        }
        $sql .= ' ORDER BY u.created_at DESC LIMIT ' . (int) $limit;

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getOrderCount(int $userId): int
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM orders WHERE user_id = :user_id');
        $stmt->execute([':user_id' => $userId]);
        return (int) $stmt->fetchColumn();
    }

    public function isLastActiveAdmin(int $id): bool
    {
        $user = $this->findById($id);
        if (!$user || $user['role'] !== 'admin') return false;
        $stmt = $this->pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = 1 AND id != " . (int) $id);
        return (int) $stmt->fetchColumn() === 0;
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM users WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }

    public function hasOrders(int $id): bool
    {
        return $this->getOrderCount($id) > 0;
    }
}
