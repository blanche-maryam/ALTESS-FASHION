<?php
// =============================================================================
// ALTESS FASHION — Middleware d'authentification
// =============================================================================

function startSessionSafe(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
}

function currentUserId(): ?int
{
    startSessionSafe();
    return isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
}

function currentUserRole(): ?string
{
    startSessionSafe();
    return $_SESSION['user_role'] ?? null;
}

function isAdmin(): bool
{
    return currentUserRole() === 'admin';
}

function requireAuth(): void
{
    startSessionSafe();
    if (!isset($_SESSION['user_id'])) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(401);
        echo json_encode(['error' => 'Authentification requise']);
        exit;
    }
}

function requireAdmin(): void
{
    startSessionSafe();
    if (!isset($_SESSION['user_id'])) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(401);
        echo json_encode(['error' => 'Authentification requise']);
        exit;
    }
    if (($_SESSION['user_role'] ?? null) !== 'admin') {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(403);
        echo json_encode(['error' => 'Accès administrateur requis']);
        exit;
    }
}
