<?php
// =============================================================================
// ALTESS FASHION — API Auth (register, login, logout, me, update profile)
// =============================================================================

require_once __DIR__ . '/../../index.php';
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/User.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$db = getDB();
$userModel = new User($db);

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$action = basename($path);

switch ($action) {
    // -----------------------------------------------------------------
    case 'register.php':
        if ($method !== 'POST') apiError('Méthode non autorisée', 405);
        $data = readJsonBody();

        $required = ['lastname', 'firstname', 'email', 'password'];
        foreach ($required as $field) {
            if (empty($data[$field])) apiError("Le champ $field est requis", 422);
        }

        $email = strtolower(trim((string) $data['email']));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) apiError('Email invalide', 422);
        if (strlen((string) $data['password']) < 6) apiError('Mot de passe minimum 6 caractères', 422);
        if ((string) $data['password'] !== (string) ($data['password_confirm'] ?? '')) {
            apiError('Les mots de passe ne correspondent pas', 422);
        }
        if ($userModel->findByEmail($email)) apiError('Cet email est déjà utilisé', 409);

        $userId = $userModel->create([
            'lastname'  => sanitizeText($data['lastname'], 100),
            'firstname' => sanitizeText($data['firstname'], 100),
            'email'     => $email,
            'phone'     => sanitizeText($data['phone'] ?? null, 20),
            'password'  => password_hash((string) $data['password'], PASSWORD_BCRYPT),
            'address'   => sanitizeText($data['address'] ?? null, 1000),
            'role'      => 'customer',
        ]);

        apiSuccess('Compte créé avec succès', ['user_id' => $userId], 201);

    // -----------------------------------------------------------------
    case 'login.php':
        if ($method !== 'POST') apiError('Méthode non autorisée', 405);
        $data = readJsonBody();

        if (empty($data['email']) || empty($data['password'])) {
            apiError('Email et mot de passe requis', 422);
        }

        $user = $userModel->findByEmail(strtolower(trim((string) $data['email'])));
        if (!$user || !password_verify((string) $data['password'], $user['password'])) {
            apiError('Identifiants incorrects', 401);
        }
        if (!(int) $user['is_active']) {
            apiError('Compte désactivé. Contactez l\'administrateur.', 403);
        }

        startSessionSafe();
        session_regenerate_id(true);
        $_SESSION['user_id'] = (int) $user['id'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['user_lastname'] = $user['lastname'];
        $_SESSION['user_firstname'] = $user['firstname'];
        $_SESSION['user_email'] = $user['email'];

        apiSuccess('Connexion réussie', [
            'user' => [
                'id'        => (int) $user['id'],
                'lastname'  => $user['lastname'],
                'firstname' => $user['firstname'],
                'email'     => $user['email'],
                'role'      => $user['role'],
            ],
        ]);

    // -----------------------------------------------------------------
    case 'logout.php':
        if ($method !== 'POST') apiError('Méthode non autorisée', 405);
        startSessionSafe();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
        }
        session_destroy();
        apiSuccess('Déconnecté');

    // -----------------------------------------------------------------
    case 'me.php':
        requireAuth();
        $user = $userModel->findById(currentUserId());
        if (!$user) apiError('Utilisateur non trouvé', 404);
        apiJson(['user' => $user]);

    // -----------------------------------------------------------------
    case 'profile.php':
    case 'update.php':
        if ($method !== 'PUT' && $method !== 'POST' && $method !== 'PATCH') apiError('Méthode non autorisée', 405);
        requireAuth();

        $userId = currentUserId();
        $user = $userModel->findById($userId);
        if (!$user) apiError('Utilisateur non trouvé', 404);

        $data = readJsonBody();
        $payload = [];

        foreach (['lastname', 'firstname', 'phone', 'address'] as $field) {
            if (array_key_exists($field, $data)) $payload[$field] = sanitizeText($data[$field], 255);
        }

        if (!empty($data['new_password'])) {
            if (strlen((string) $data['new_password']) < 6) apiError('Nouveau mot de passe minimum 6 caractères', 422);
            $current = $userModel->findByEmail($user['email'])['password'] ?? '';
            if (empty($data['current_password']) || !password_verify((string) $data['current_password'], $current)) {
                apiError('Mot de passe actuel incorrect', 403);
            }
            $payload['password'] = password_hash((string) $data['new_password'], PASSWORD_BCRYPT);
        } elseif (!empty($data['password'])) {
            if (strlen((string) $data['password']) < 6) apiError('Mot de passe minimum 6 caractères', 422);
            $payload['password'] = password_hash((string) $data['password'], PASSWORD_BCRYPT);
        }

        $userModel->update($userId, $payload);

        $fresh = $userModel->findById($userId);
        $_SESSION['user_lastname'] = $fresh['lastname'];
        $_SESSION['user_firstname'] = $fresh['firstname'];
        $_SESSION['user_email'] = $fresh['email'];

        apiSuccess('Profil mis à jour', ['user' => $fresh]);

    // -----------------------------------------------------------------
    default:
        apiError('Endpoint non trouvé', 404);
}
