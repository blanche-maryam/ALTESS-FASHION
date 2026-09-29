<?php
// =============================================================================
// ALTESS FASHION — Model Produit
// =============================================================================

class Product
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    private function baseSelect(): string
    {
        return 'SELECT p.*, c.name as category_name, c.slug as category_slug, sc.name as subcategory_name, sc.slug as subcategory_slug, '
             . '(SELECT pi.image_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC LIMIT 1) as main_image, '
             . '(SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id) as image_count '
             . 'FROM products p '
             . 'LEFT JOIN categories c ON p.category_id = c.id '
             . 'LEFT JOIN categories sc ON p.subcategory_id = sc.id';
    }

    private function buildFilters(array $filters): array
    {
        $where = [];
        $params = [];

        if (!empty($filters['gender'])) {
            $where[] = 'p.gender = :gender';
            $params[':gender'] = $filters['gender'];
        }
        if (!empty($filters['category_id'])) {
            // Correspond sur toute la branche : la catégorie elle-même, ses sous-catégories
            // et le parent renseigné dans subcategory_id. L'entier est déjà casté,
            // il est interpolé car PDO refuse un paramètre nommé réutilisé.
            $catId = (int) $filters['category_id'];
            $where[] = "(p.category_id = $catId
                         OR p.subcategory_id = $catId
                         OR p.category_id IN (SELECT ch.id FROM categories ch WHERE ch.parent_id = $catId))";
        }
        if (!empty($filters['subcategory_id'])) {
            $where[] = 'p.subcategory_id = :subcategory_id';
            $params[':subcategory_id'] = (int) $filters['subcategory_id'];
        }
        if (!empty($filters['search'])) {
            // PDO refuse un paramètre nommé réutilisé : la valeur est échappée
            // via quote() puis interpolée, et le joker LIKE est ajouté.
            $needle = $this->pdo->quote('%' . (string) $filters['search'] . '%');
            $where[] = "(p.name LIKE $needle OR p.description LIKE $needle"
                     . " OR p.short_description LIKE $needle OR p.slug LIKE $needle)";
        }
        if (isset($filters['is_active']) && $filters['is_active'] !== '' && $filters['is_active'] !== null) {
            $where[] = 'p.is_active = :is_active';
            $params[':is_active'] = (int) $filters['is_active'];
        }
        if (isset($filters['is_promo']) && $filters['is_promo'] !== '' && $filters['is_promo'] !== null) {
            $where[] = 'p.is_promo = :is_promo';
            $params[':is_promo'] = (int) $filters['is_promo'];
        }
        if (isset($filters['in_stock']) && $filters['in_stock'] !== '' && $filters['in_stock'] !== null) {
            if ((int) $filters['in_stock'] === 1) {
                $where[] = 'p.stock > 0';
            } else {
                $where[] = 'p.stock = 0';
            }
        }
        if (!empty($filters['min_price'])) {
            $where[] = 'p.price >= :min_price';
            $params[':min_price'] = (float) $filters['min_price'];
        }
        if (!empty($filters['max_price'])) {
            $where[] = 'p.price <= :max_price';
            $params[':max_price'] = (float) $filters['max_price'];
        }

        return [$where, $params];
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare($this->baseSelect() . ' WHERE p.id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        if ($product) {
            $product['images'] = $this->getImages($id);
            $product['variants'] = $this->getVariants($id);
        }
        return $product;
    }

    public function findBySlug(string $slug): ?array
    {
        $stmt = $this->pdo->prepare($this->baseSelect() . ' WHERE p.slug = :slug LIMIT 1');
        $stmt->execute([':slug' => $slug]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        if ($product) {
            $product['images'] = $this->getImages((int) $product['id']);
            $product['variants'] = $this->getVariants((int) $product['id']);
        }
        return $product;
    }

    public function getAll(array $filters = []): array
    {
        [$where, $params] = $this->buildFilters($filters);
        $sql = $this->baseSelect() . ' WHERE 1=1';
        if ($where) $sql .= ' AND ' . implode(' AND ', $where);

        $sort = $this->resolveSort($filters['sort'] ?? null);
        $sql .= ' ORDER BY ' . $sort;

        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = (int) ($filters['per_page'] ?? 12);
        $perPage = max(1, min(200, $perPage));
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
        [$where, $params] = $this->buildFilters($filters);
        $sql = 'SELECT COUNT(*) FROM products p WHERE 1=1';
        if ($where) $sql .= ' AND ' . implode(' AND ', $where);

        $stmt = $this->pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->execute();
        return (int) $stmt->fetchColumn();
    }

    private function resolveSort(?string $sort): string
    {
        $allowed = [
            'name'       => 'p.name ASC, p.id ASC',
            'name_desc'  => 'p.name DESC, p.id DESC',
            'price'      => 'p.price ASC, p.id ASC',
            'price_desc' => 'p.price DESC, p.id DESC',
            'stock'      => 'p.stock ASC, p.id ASC',
            'stock_desc' => 'p.stock DESC, p.id DESC',
            'oldest'     => 'p.created_at ASC, p.id ASC',
            'newest'     => 'p.created_at DESC, p.id DESC',
        ];
        return $allowed[$sort] ?? 'p.created_at DESC, p.id DESC';
    }

    public function slugExists(string $slug, ?int $excludeId = null): bool
    {
        $sql = 'SELECT COUNT(*) FROM products WHERE slug = :slug';
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
        $slug = $base !== '' ? $base : 'produit';
        if (!$this->slugExists($slug, $excludeId)) return $slug;
        $i = 2;
        while ($this->slugExists($slug . '-' . $i, $excludeId)) {
            $i++;
        }
        return $slug . '-' . $i;
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare('INSERT INTO products (name, slug, description, short_description, category_id, subcategory_id, gender, price, old_price, stock, is_active, is_promo, meta_title, meta_description) VALUES (:name, :slug, :description, :short_description, :category_id, :subcategory_id, :gender, :price, :old_price, :stock, :is_active, :is_promo, :meta_title, :meta_description)');
        $stmt->execute([
            'name'             => $data['name'],
            'slug'             => $data['slug'],
            'description'      => $data['description'] ?? null,
            'short_description'=> $data['short_description'] ?? null,
            'category_id'      => (int) $data['category_id'],
            'subcategory_id'   => !empty($data['subcategory_id']) ? (int) $data['subcategory_id'] : null,
            'gender'           => $data['gender'] ?? 'unisex',
            'price'            => (float) $data['price'],
            'old_price'        => isset($data['old_price']) && $data['old_price'] !== '' ? (float) $data['old_price'] : null,
            'stock'            => (int) ($data['stock'] ?? 0),
            'is_active'        => !empty($data['is_active']) ? 1 : 0,
            'is_promo'         => !empty($data['is_promo']) ? 1 : 0,
            'meta_title'       => $data['meta_title'] ?? null,
            'meta_description' => $data['meta_description'] ?? null,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        if (!$this->findById($id)) return false;

        $fields = [];
        $params = [':id' => $id];
        $allowed = ['name', 'slug', 'description', 'short_description', 'category_id', 'subcategory_id', 'gender', 'price', 'old_price', 'stock', 'is_active', 'is_promo', 'meta_title', 'meta_description'];

        foreach ($allowed as $field) {
            if (!array_key_exists($field, $data)) continue;
            $fields[] = "$field = :$field";
            $value = $data[$field];
            if ($field === 'category_id' || $field === 'subcategory_id') {
                $value = ($value === '' || $value === null) ? null : (int) $value;
            } elseif ($field === 'price' || $field === 'old_price') {
                $value = ($value === '' || $value === null) ? null : (float) $value;
            } elseif ($field === 'stock') {
                $value = max(0, (int) $value);
            } elseif ($field === 'is_active' || $field === 'is_promo') {
                $value = $value ? 1 : 0;
            } else {
                $value = ($value === '') ? null : $value;
            }
            $params[":$field"] = $value;
        }

        if (empty($fields)) return true;

        $fields[] = 'updated_at = NOW()';
        $stmt = $this->pdo->prepare('UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = :id');
        return $stmt->execute($params);
    }

    public function countOrderItems(int $id): int
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM order_items WHERE product_id = :id');
        $stmt->execute([':id' => $id]);
        return (int) $stmt->fetchColumn();
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM products WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }

    public function toggleActive(int $id): bool
    {
        $stmt = $this->pdo->prepare('UPDATE products SET is_active = 1 - is_active, updated_at = NOW() WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }

    // -------------------------------------------------------------------------
    // Images
    // -------------------------------------------------------------------------

    public function getImages(int $productId): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM product_images WHERE product_id = :product_id ORDER BY is_primary DESC, sort_order ASC, id ASC');
        $stmt->execute([':product_id' => $productId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function addImage(int $productId, string $path, ?string $altText = null, int $sortOrder = 0): int
    {
        $hasImages = (int) $this->pdo->query('SELECT COUNT(*) FROM product_images WHERE product_id = ' . (int) $productId)->fetchColumn();
        $isPrimary = $hasImages === 0 ? 1 : 0;

        $stmt = $this->pdo->prepare('INSERT INTO product_images (product_id, image_path, alt_text, is_primary, sort_order) VALUES (:product_id, :image_path, :alt_text, :is_primary, :sort_order)');
        $stmt->execute([
            ':product_id' => $productId,
            ':image_path' => $path,
            ':alt_text'   => $altText,
            ':is_primary' => $isPrimary,
            ':sort_order' => $sortOrder,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function deleteImage(int $productId, int $imageId): bool
    {
        $stmt = $this->pdo->prepare('SELECT * FROM product_images WHERE id = :id AND product_id = :product_id');
        $stmt->execute([':id' => $imageId, ':product_id' => $productId]);
        $image = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$image) return false;

        $del = $this->pdo->prepare('DELETE FROM product_images WHERE id = :id');
        $del->execute([':id' => $imageId]);

        if ((int) $image['is_primary'] === 1) {
            $next = $this->pdo->prepare('SELECT id FROM product_images WHERE product_id = :product_id ORDER BY sort_order ASC, id ASC LIMIT 1');
            $next->execute([':product_id' => $productId]);
            $nextId = $next->fetchColumn();
            if ($nextId) {
                $up = $this->pdo->prepare('UPDATE product_images SET is_primary = 1 WHERE id = :id');
                $up->execute([':id' => (int) $nextId]);
            }
        }
        return true;
    }

    public function setPrimaryImage(int $productId, int $imageId): bool
    {
        $check = $this->pdo->prepare('SELECT COUNT(*) FROM product_images WHERE id = :id AND product_id = :product_id');
        $check->execute([':id' => $imageId, ':product_id' => $productId]);
        if ((int) $check->fetchColumn() === 0) return false;

        $this->pdo->prepare('UPDATE product_images SET is_primary = 0 WHERE product_id = :product_id')->execute([':product_id' => $productId]);
        $stmt = $this->pdo->prepare('UPDATE product_images SET is_primary = 1 WHERE id = :id');
        return $stmt->execute([':id' => $imageId]);
    }

    // -------------------------------------------------------------------------
    // Variants (taille / couleur)
    // -------------------------------------------------------------------------

    public function getVariants(int $productId): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM product_variants WHERE product_id = :product_id ORDER BY size ASC, color ASC');
        $stmt->execute([':product_id' => $productId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function saveVariants(int $productId, array $variants): void
    {
        $existing = [];
        foreach ($this->getVariants($productId) as $v) {
            $existing[(int) $v['id']] = $v;
        }

        $keep = [];
        $insert = $this->pdo->prepare('INSERT INTO product_variants (product_id, size, color, color_hex, stock) VALUES (:product_id, :size, :color, :color_hex, :stock)');
        $update = $this->pdo->prepare('UPDATE product_variants SET size = :size, color = :color, color_hex = :color_hex, stock = :stock WHERE id = :id');

        foreach ($variants as $variant) {
            $size = trim((string) ($variant['size'] ?? ''));
            $color = trim((string) ($variant['color'] ?? ''));
            $hex = trim((string) ($variant['color_hex'] ?? '')) ?: null;
            $stock = max(0, (int) ($variant['stock'] ?? 0));
            if ($size === '' && $color === '') continue;

            if (!empty($variant['id']) && isset($existing[(int) $variant['id']])) {
                $update->execute([':size' => $size ?: null, ':color' => $color ?: null, ':color_hex' => $hex, ':stock' => $stock, ':id' => (int) $variant['id']]);
                $keep[(int) $variant['id']] = true;
            } else {
                $insert->execute([':product_id' => $productId, ':size' => $size ?: null, ':color' => $color ?: null, ':color_hex' => $hex, ':stock' => $stock]);
            }
        }

        foreach (array_keys($existing) as $variantId) {
            if (!isset($keep[$variantId])) {
                $del = $this->pdo->prepare('DELETE FROM product_variants WHERE id = :id');
                $del->execute([':id' => $variantId]);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Stock
    // -------------------------------------------------------------------------

    public function adjustStock(int $id, int $delta): bool
    {
        $stmt = $this->pdo->prepare('UPDATE products SET stock = GREATEST(0, stock + :delta), updated_at = NOW() WHERE id = :id');
        return $stmt->execute([':delta' => $delta, ':id' => $id]);
    }

    public function getLowStock(int $limit = 10): array
    {
        $stmt = $this->pdo->prepare($this->baseSelect() . ' WHERE p.is_active = 1 AND p.stock <= :threshold ORDER BY p.stock ASC, p.name ASC LIMIT :limit');
        $stmt->bindValue(':threshold', 5, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
