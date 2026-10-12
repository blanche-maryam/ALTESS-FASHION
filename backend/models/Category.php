<?php
// =============================================================================
// ALTESS FASHION — Model Catégorie
// =============================================================================

class Category
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT c.*, p.name as parent_name, (SELECT COUNT(*) FROM products WHERE category_id = c.id) as product_count, (SELECT COUNT(*) FROM products WHERE subcategory_id = c.id) as subcategory_product_count, (SELECT COUNT(*) FROM categories ch WHERE ch.parent_id = c.id) as children_count FROM categories c LEFT JOIN categories p ON c.parent_id = p.id WHERE c.id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function getAll(bool $activeOnly = true): array
    {
        $sql = 'SELECT c.*, (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = 1) as product_count, (SELECT COUNT(*) FROM products WHERE subcategory_id = c.id AND is_active = 1) as subcategory_product_count, (SELECT COUNT(*) FROM categories ch WHERE ch.parent_id = c.id) as children_count FROM categories c WHERE 1=1';
        if ($activeOnly) $sql .= ' AND c.is_active = 1';
        $sql .= ' ORDER BY c.sort_order ASC, c.name ASC';
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getTree(int $page = 1, int $perPage = 0): array
    {
        $all = $this->getAll(false);
        $byParent = [];
        foreach ($all as $cat) {
            $byParent[(int) ($cat['parent_id'] ?? 0)][] = $cat;
        }
        $build = function (int $parentId) use (&$build, $byParent) {
            $nodes = [];
            foreach ($byParent[$parentId] ?? [] as $cat) {
                $cat['children'] = $build((int) $cat['id']);
                $nodes[] = $cat;
            }
            return $nodes;
        };

        // Racines : pagination optionnelle (0 = tout, compatibilité).
        // Les enfants restent imbriqués sous leur racine.
        $roots = $byParent[0] ?? [];
        if ($perPage > 0) {
            $page = max(1, $page);
            $perPage = max(1, min(100, $perPage));
            $roots = array_slice($roots, ($page - 1) * $perPage, $perPage);
        }

        $tree = [];
        foreach ($roots as $cat) {
            $cat['children'] = $build((int) $cat['id']);
            $tree[] = $cat;
        }
        return $tree;
    }

    public function countRoots(): int
    {
        $stmt = $this->pdo->query('SELECT COUNT(*) FROM categories WHERE parent_id IS NULL');
        return (int) $stmt->fetchColumn();
    }

    public function getRoots(bool $activeOnly = true): array
    {
        $sql = 'SELECT c.*, (SELECT COUNT(*) FROM products p
                            WHERE p.is_active = 1
                              AND (p.category_id = c.id
                                   OR p.category_id IN (SELECT ch.id FROM categories ch WHERE ch.parent_id = c.id)
                                   OR p.subcategory_id = c.id)) as product_count
                FROM categories c WHERE c.parent_id IS NULL';
        if ($activeOnly) $sql .= ' AND c.is_active = 1';
        $sql .= ' ORDER BY c.sort_order ASC, c.name ASC';
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getByTarget(string $gender): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM categories WHERE target_audience = :gender AND parent_id IS NULL AND is_active = 1 ORDER BY sort_order');
        $stmt->execute([':gender' => $gender]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getSubcategories(int $parentId, bool $activeOnly = true): array
    {
        $sql = 'SELECT c.*, (SELECT COUNT(*) FROM products WHERE (category_id = c.id OR subcategory_id = c.id) AND is_active = 1) as product_count FROM categories c WHERE c.parent_id = :parent_id';
        if ($activeOnly) $sql .= ' AND c.is_active = 1';
        $sql .= ' ORDER BY c.sort_order ASC, c.name ASC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':parent_id' => $parentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function slugExists(string $slug, ?int $excludeId = null): bool
    {
        $sql = 'SELECT COUNT(*) FROM categories WHERE slug = :slug';
        $params = [':slug' => $slug];
        if ($excludeId) {
            $sql .= ' AND id != :id';
            $params[':id'] = $excludeId;
        }
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn() > 0;
    }

    public function uniqueSlug(string $base, ?int $excludeId = null): string
    {
        $slug = $base !== '' ? $base : 'categorie';
        if (!$this->slugExists($slug, $excludeId)) return $slug;
        $i = 2;
        while ($this->slugExists($slug . '-' . $i, $excludeId)) {
            $i++;
        }
        return $slug . '-' . $i;
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare('INSERT INTO categories (name, slug, parent_id, target_audience, image, is_active, sort_order) VALUES (:name, :slug, :parent_id, :target_audience, :image, :is_active, :sort_order)');
        $stmt->execute([
            'name'            => $data['name'],
            'slug'            => $data['slug'],
            'parent_id'       => !empty($data['parent_id']) ? (int) $data['parent_id'] : null,
            'target_audience' => $data['target_audience'] ?? 'unisex',
            'image'           => $data['image'] ?? null,
            'is_active'       => array_key_exists('is_active', $data) ? (!empty($data['is_active']) ? 1 : 0) : 1,
            'sort_order'      => (int) ($data['sort_order'] ?? 0),
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        if (!$this->findById($id)) return false;

        $fields = [];
        $params = [':id' => $id];
        foreach (['name', 'slug', 'parent_id', 'target_audience', 'image', 'sort_order', 'is_active'] as $field) {
            if (!array_key_exists($field, $data)) continue;
            $fields[] = "$field = :$field";
            $value = $data[$field];
            if ($field === 'parent_id') {
                $value = ($value === '' || $value === null) ? null : (int) $value;
            } elseif ($field === 'sort_order') {
                $value = (int) $value;
            } elseif ($field === 'is_active') {
                $value = $value ? 1 : 0;
            } else {
                $value = ($value === '') ? null : $value;
            }
            $params[":$field"] = $value;
        }

        if (empty($fields)) return true;
        $fields[] = 'updated_at = NOW()';

        $stmt = $this->pdo->prepare('UPDATE categories SET ' . implode(', ', $fields) . ' WHERE id = :id');
        return $stmt->execute($params);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM categories WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }

    public function countProducts(int $id): int
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM products WHERE category_id = :id OR subcategory_id = :id2');
        $stmt->execute([':id' => $id, ':id2' => $id]);
        return (int) $stmt->fetchColumn();
    }

    public function childIds(int $id): array
    {
        $stmt = $this->pdo->query('SELECT id FROM categories WHERE parent_id = ' . (int) $id);
        return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    public function isDescendant(int $candidateId, int $ofId): bool
    {
        $current = $this->findById($candidateId);
        $guard = 0;
        while ($current && !empty($current['parent_id']) && $guard < 20) {
            if ((int) $current['parent_id'] === $ofId) return true;
            $current = $this->findById((int) $current['parent_id']);
            $guard++;
        }
        return false;
    }

    public function reorder(array $orderedIds): void
    {
        $stmt = $this->pdo->prepare('UPDATE categories SET sort_order = :sort_order, updated_at = NOW() WHERE id = :id');
        $i = 0;
        foreach ($orderedIds as $id) {
            $stmt->execute([':sort_order' => $i, ':id' => (int) $id]);
            $i++;
        }
    }
}
