-- =============================================================================
-- ALTESS FASHION — Base de données MySQL
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `altess_fashion` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `altess_fashion`;

-- =============================================================================
-- TABLE: users
-- Rôle : Utilisateurs du site (clients et administrateurs)
-- =============================================================================
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `lastname` VARCHAR(100) NOT NULL COMMENT 'Nom de famille',
  `firstname` VARCHAR(100) NOT NULL COMMENT 'Prénom',
  `email` VARCHAR(255) NOT NULL COMMENT 'Adresse email',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT 'Téléphone',
  `password` VARCHAR(255) NOT NULL COMMENT 'Mot de passe hashé',
  `address` TEXT DEFAULT NULL COMMENT 'Adresse postale',
  `role` ENUM('customer','admin') NOT NULL DEFAULT 'customer' COMMENT 'Rôle utilisateur',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Compte actif',
  `remember_token` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- TABLE: categories
-- Rôle : Catégories et sous-catégories de produits
-- =============================================================================
CREATE TABLE `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT 'Nom de la catégorie',
  `slug` VARCHAR(120) NOT NULL COMMENT 'URL friendly',
  `parent_id` INT UNSIGNED DEFAULT NULL COMMENT 'Catégorie parente (sous-catégorie)',
  `target_audience` ENUM('female','male','unisex') NOT NULL DEFAULT 'unisex' COMMENT 'Public cible',
  `image` VARCHAR(500) DEFAULT NULL COMMENT 'Image de la catégorie',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Catégorie active',
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Ordre daffichage',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_categories_slug` (`slug`),
  KEY `idx_categories_parent` (`parent_id`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- TABLE: products
-- Rôle : Produits de la boutique
-- =============================================================================
CREATE TABLE `products` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL COMMENT 'Nom du produit',
  `slug` VARCHAR(280) NOT NULL COMMENT 'URL friendly',
  `description` TEXT DEFAULT NULL COMMENT 'Description complète',
  `short_description` VARCHAR(500) DEFAULT NULL COMMENT 'Description courte',
  `category_id` INT UNSIGNED NOT NULL COMMENT 'Catégorie principale',
  `subcategory_id` INT UNSIGNED DEFAULT NULL COMMENT 'Sous-catégorie',
  `gender` ENUM('female','male','unisex') NOT NULL DEFAULT 'unisex' COMMENT 'Public cible',
  `price` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Prix actuel',
  `old_price` DECIMAL(12,2) DEFAULT NULL COMMENT 'Ancien prix (promotion)',
  `stock` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Stock disponible',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Produit actif',
  `is_promo` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'En promotion',
  `meta_title` VARCHAR(255) DEFAULT NULL COMMENT 'Titre SEO',
  `meta_description` VARCHAR(500) DEFAULT NULL COMMENT 'Description SEO',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_products_slug` (`slug`),
  KEY `idx_products_category` (`category_id`),
  KEY `idx_products_gender` (`gender`),
  KEY `idx_products_active` (`is_active`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_products_subcategory` FOREIGN KEY (`subcategory_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- TABLE: product_images
-- Rôle : Images multiples par produit
-- =============================================================================
CREATE TABLE `product_images` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NOT NULL COMMENT 'Produit associé',
  `image_path` VARCHAR(500) NOT NULL COMMENT 'Chemin de limage',
  `alt_text` VARCHAR(255) DEFAULT NULL COMMENT 'Texte alternatif',
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Image principale',
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product_images_product` (`product_id`),
  CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- TABLE: product_variants
-- Rôle : Variant de produit (taille + couleur)
-- =============================================================================
CREATE TABLE `product_variants` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NOT NULL,
  `size` VARCHAR(20) DEFAULT NULL COMMENT 'Taille (S, M, L, XL, etc.)',
  `color` VARCHAR(50) DEFAULT NULL COMMENT 'Couleur',
  `color_hex` VARCHAR(7) DEFAULT NULL COMMENT 'Code hex couleur',
  `stock` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Stock pour ce variant',
  PRIMARY KEY (`id`),
  KEY `idx_variants_product` (`product_id`),
  CONSTRAINT `fk_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- TABLE: carts
-- Rôle : Paniers utilisateurs
-- =============================================================================
CREATE TABLE `carts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED DEFAULT NULL COMMENT 'Utilisateur (NULL si invité)',
  `session_id` VARCHAR(128) DEFAULT NULL COMMENT 'Session pour panier invité',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_carts_user` (`user_id`),
  KEY `idx_carts_session` (`session_id`),
  CONSTRAINT `fk_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- TABLE: cart_items
-- Rôle : Articles dans le panier
-- =============================================================================
CREATE TABLE `cart_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `cart_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `size` VARCHAR(20) DEFAULT NULL,
  `color` VARCHAR(50) DEFAULT NULL,
  `price` DECIMAL(12,2) NOT NULL COMMENT 'Prix au moment de lajout',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cart_items_cart` (`cart_id`),
  KEY `idx_cart_items_product` (`product_id`),
  CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cart_items_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- TABLE: orders
-- Rôle : Commandes clients
-- =============================================================================
CREATE TABLE `orders` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number` VARCHAR(50) NOT NULL COMMENT 'Numéro de commande',
  `user_id` INT UNSIGNED NOT NULL COMMENT 'Client',
  `status` ENUM('pending','confirmed','preparing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending' COMMENT 'Statut de la commande',
  `payment_method` VARCHAR(50) DEFAULT NULL COMMENT 'Méthode de paiement',
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Total avec livraison',
  `shipping_address` TEXT NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_orders_number` (`order_number`),
  KEY `idx_orders_user` (`user_id`),
  KEY `idx_orders_status` (`status`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- TABLE: order_items
-- Rôle : Lignes de commande
-- =============================================================================
CREATE TABLE `order_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `product_name` VARCHAR(255) NOT NULL COMMENT 'Nom figé au moment de la commande',
  `product_image` VARCHAR(500) DEFAULT NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `size` VARCHAR(20) DEFAULT NULL,
  `color` VARCHAR(50) DEFAULT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL COMMENT 'Prix unitaire au moment de la commande',
  `subtotal` DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order` (`order_id`),
  KEY `idx_order_items_product` (`product_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- DONNÉES DE BASE
-- =============================================================================

-- Catégories Femme
INSERT INTO `categories` (`name`, `slug`, `parent_id`, `target_audience`, `sort_order`) VALUES
('Vêtements', 'vetements', NULL, 'female', 1),
('Chaussures', 'chaussures', NULL, 'female', 2),
('Bijoux', 'bijoux', NULL, 'female', 3),
('Sacs', 'sacs', NULL, 'female', 4),
('Robes', 'robes', 1, 'female', 1),
('Ensembles', 'ensembles', 1, 'female', 2),
('Pantalons', 'pantalons', 1, 'female', 3),
('Jupes', 'jupes', 1, 'female', 4),
('Chemises', 'chemises', 1, 'female', 5),
('T-shirts', 't-shirts', 1, 'female', 6),
('Vestes', 'vestes', 1, 'female', 7),
('Escarpins', 'escarpins', 2, 'female', 1),
('Sandales', 'sandalies', 2, 'female', 2),
('Baskets', 'baskets', 2, 'female', 3),
('Colliers', 'colliers', 3, 'female', 1),
('Bracelets', 'bracelets', 3, 'female', 2),
('Boucles d\'oreilles', 'boucles-doreilles', 3, 'female', 3),
('Sacs à main', 'sacs-a-main', 4, 'female', 1);

-- Catégories Homme
INSERT INTO `categories` (`name`, `slug`, `parent_id`, `target_audience`, `sort_order`) VALUES
('Vêtements', 'vetements-homme', NULL, 'male', 1),
('Chaussures', 'chaussures-homme', NULL, 'male', 2),
('Bijoux', 'bijoux-homme', NULL, 'male', 3),
('Sacs et accessoires', 'sacs-accessoires-homme', NULL, 'male', 4),
('Chemises', 'chemises-homme', 19, 'male', 1),
('T-shirts', 't-shirts-homme', 19, 'male', 2),
('Polos', 'polos', 19, 'male', 3),
('Pantalons', 'pantalons-homme', 19, 'male', 4),
('Jeans', 'jeans', 19, 'male', 5),
('Shorts', 'shorts', 19, 'male', 6),
('Vestes', 'vestes-homme', 19, 'male', 7),
('Blazers', 'blazers', 19, 'male', 8),
('Costumes', 'costumes', 19, 'male', 9),
('Chaussures de ville', 'chaussures-de-ville', 20, 'male', 1),
('Mocassins', 'mocassins', 20, 'male', 2),
('Baskets', 'baskets-homme', 20, 'male', 3),
('Montres', 'montres', 21, 'male', 1),
('Sacs à dos', 'sacs-a-dos', 22, 'male', 1),
('Portefeuilles', 'portefeuilles', 22, 'male', 3),
('Ceintures', 'ceintures', 22, 'male', 4);

-- Catégories Unisexe
INSERT INTO `categories` (`name`, `slug`, `parent_id`, `target_audience`, `sort_order`) VALUES
('Vêtements', 'vetements-unisexe', NULL, 'unisex', 1),
('Accessoires', 'accessoires-unisexe', NULL, 'unisex', 2);

-- Produits de démonstration
INSERT INTO `products` (`name`, `slug`, `description`, `short_description`, `category_id`, `subcategory_id`, `gender`, `price`, `old_price`, `stock`, `is_active`, `is_promo`) VALUES
('Robe Bazin Élégante', 'robe-bazin-elegante', 'Robe en bazin de qualité supérieure, coupe élégante et féminine. Parfaite pour les occasions spéciales.', 'Robe bazin premium', 5, 1, 'female', 45000, 55000, 15, 1, 1),
('Chemise Homme Premium', 'chemise-homme-premium', 'Chemise en coton bio, coupe ajustée. Un classique intemporel.', 'Chemise coton bio', 25, 5, 'male', 35000, null, 20, 1, 0),
('Escarpin Cuir Classique', 'escarpin-cuir-classique', 'Escarpin en cuir véritable, talon raisonnable pour un confort toute la journée.', 'Escarpin cuir', 12, 11, 'female', 42000, 52000, 8, 1, 1),
('Sac à Main Élégant', 'sac-main-elegant', 'Sac à main en cuir italien, spacieux et raffiné.', 'Sac cuir italien', 16, 15, 'female', 55000, null, 5, 1, 0),
('Bague Dorée Minimaliste', 'bague-doree-minimaliste', 'Bague en acier inoxydable doré, design minimaliste et moderne.', 'Bague dorée', 14, 13, 'unisex', 15000, null, 30, 1, 0),
('Pantalon Habillé Homme', 'pantalon-habille-homme', 'Pantalon habillé en flanelle, coupe slim', 'Pantalon habillé', 29, 9, 'male', 28000, null, 12, 1, 0),
('Veste Blazer Femme', 'veste-blazer-femme', 'Veste blazer structurée, coupe cintrée pour une silhouette professionnelle.', 'Blazer femme', 11, 7, 'female', 48000, 58000, 7, 1, 1),
('Baskets Sport Homme', 'baskets-sport-homme', 'Baskets confortables en mesh respirant, style urbain.', 'Baskets confort', 28, 3, 'male', 22000, null, 25, 1, 0),
('Collier Perles Fines', 'collier-perles-fines', 'Collier de perles d''eau douce, chaîne dorée finement travaillée.', 'Collier perles', 14, 14, 'female', 32000, null, 10, 1, 0),
('Polo Homme Classique', 'polo-homme-classique', 'Polo en piqué de coton, coupe regular comfort.', 'Polo coton piqué', 26, 3, 'male', 18000, null, 18, 1, 0);