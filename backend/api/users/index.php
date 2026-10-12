<?php
// =============================================================================
// ALTESS FASHION — API Users (admin + profil)
// =============================================================================

require_once __DIR__ . '/../../index.php';
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/User.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$db = getDB();
$userModel = new User($db);

$method = $_SERVER['REQUEST_METHOD'];
$id = queryInt($_GET['id'] ?? null);

// -------------------------------------------------------------------------
// GET
// -------------------------------------------------------------------------
if ($method === 'GET') {
    if ($id) {
        requireAuth();
        $self = currentUserId();
        if ($id !== $self && !isAdmin()) apiError('Accès refusé', 403);
        $user = $userModel->findById($id);
        if (!$user) apiError('Utilisateur non trouvé', 404);
        $user['order_count'] = $userModel->getOrderCount($id);
        apiJson(['user' => $user]);
    }

    if (!empty($_GET['me'])) {
        requireAuth();
        $user = $userModel->findById(currentUserId());
        if (!$user) apiError('Utilisateur non trouvé', 404);
        apiJson(['user' => $user]);
    }

    requireAdmin();
    $filters = [];
    if (!empty($_GET['search'])) $filters['search'] = $_GET['search'];
    if (!empty($_GET['role'])) $filters['role'] = $_GET['role'];
    $page = max(1, (int) ($_GET['page'] ?? 1));
    $perPage = max(1, min(100, (int) ($_GET['per_page'] ?? 20)));

    $total = $userModel->countAll($filters['search'] ?? null, $filters['role'] ?? null);
    apiJson([
        'users'    => $userModel->getAll($filters['search'] ?? null, $filters['role'] ?? null, $page, $perPage),
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
    requireAuth();

    $self = currentUserId();
    $admin = isAdmin();
    $targetId = $id ?? $self;
    if (!$targetId) apiError('ID requis');
    if ($targetId !== $self && !$admin) apiError('Accès refusé', 403);
    if (!$userModel->findById($targetId)) apiError('Utilisateur non trouvé', 404);

    $data = readJsonBody();
    $payload = [];

    foreach (['lastname', 'firstname', 'phone', 'address'] as $field) {
        if (array_key_exists($field, $data)) {
            $payload[$field] = sanitizeText($data[$field], 255);
        }
    }

    if (array_key_exists('email', $data)) {
        $email = strtolower(trim((string) $data['email']));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) apiError('Email invalide', 422);
        $existing = $userModel->findByEmail($email);
        if ($existing && (int) $existing['id'] !== $targetId) apiError('Cet email est déjà utilisé', 409);
        $payload['email'] = $email;
    }

    if (!empty($data['password'])) {
        if (strlen((string) $data['password']) < 6) apiError('Mot de passe minimum 6 caractères', 422);
        $payload['password'] = password_hash((string) $data['password'], PASSWORD_BCRYPT);
    }

    // Champs réservés à l'administrateur
    if ($admin && $targetId !== $self) {
        if (array_key_exists('role', $data)) {
            $newRole = $data['role'] === 'admin' ? 'admin' : 'customer';
            $target = $userModel->findById($targetId);
            if ($target['role'] === 'admin' && $newRole === 'customer' && $userModel->isLastActiveAdmin($targetId)) {
                apiError('Impossible : ce compte est le dernier administrateur actif', 409);
            }
            $payload['role'] = $newRole;
        }
        if (array_key_exists('is_active', $data)) {
            $willDeactivate = !boolFromInput($data['is_active']);
            if ($willDeactivate && $userModel->isLastActiveAdmin($targetId)) {
                apiError('Impossible : ce compte est le dernier administrateur actif', 409);
            }
            $payload['is_active'] = boolFromInput($data['is_active']);
        }
    } elseif (array_key_exists('role', $data) || array_key_exists('is_active', $data)) {
        if ($targetId === $self && array_key_exists('is_active', $data) && !boolFromInput($data['is_active'])) {
            apiError('Vous ne pouvez pas désactiver votre propre compte', 403);
        }
    }

    $userModel->update($targetId, $payload);

    apiSuccess('Utilisateur mis à jour', ['user' => $userModel->findById($targetId)]);
}

// -------------------------------------------------------------------------
// DELETE
// -------------------------------------------------------------------------
if ($method === 'DELETE') {
    requireAdmin();
    if (!$id) apiError('ID requis');
    if ($id === currentUserId()) apiError('Vous ne pouvez pas supprimer votre propre compte', 403);
    if (!$userModel->findById($id)) apiError('Utilisateur non trouvé', 404);
    if ($userModel->isLastActiveAdmin($id)) apiError('Impossible : ce compte est le dernier administrateur actif', 409);

    $orderCount = $userModel->getOrderCount($id);
    if ($orderCount > 0) {
        apiError("Impossible de supprimer : ce client a {$orderCount} commande(s). Désactivez son compte pour conserver l'historique.", 409, ['order_count' => $orderCount]);
    }

    $userModel->delete($id);
    apiSuccess('Utilisateur supprimé');
}

apiError('Endpoint non trouvé', 404);
