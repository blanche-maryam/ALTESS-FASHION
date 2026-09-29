<?php
// =============================================================================
// ALTESS FASHION — Fonctions utilitaires API
// =============================================================================

function apiJson($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function apiError(string $message, int $status = 400, array $extra = []): void
{
    apiJson(array_merge(['error' => $message], $extra), $status);
}

function apiSuccess(string $message, array $extra = [], int $status = 200): void
{
    apiJson(array_merge(['success' => true, 'message' => $message], $extra), $status);
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function sanitizeText(?string $value, int $maxLength = 500): ?string
{
    if ($value === null) return null;
    $value = trim(strip_tags($value));
    if ($value === '') return null;
    return mb_substr($value, 0, $maxLength);
}

function slugify(string $text): string
{
    $text = trim($text);
    if ($text === '') return '';

    if (function_exists('transliterator_transliterate')) {
        $text = transliterator_transliterate('Any-Latin; Latin-ASCII; Lower()', $text);
    } else {
        $text = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
        $text = preg_replace('/[?!=\'\"\\\\]/', '', $text) ?? $text;
    }

    $text = strtolower((string) $text);
    $text = preg_replace('/[^a-z0-9]+/', '-', $text) ?? '';
    $text = trim($text, '-');
    return mb_substr($text, 0, 200);
}

function boolFromInput($value): int
{
    return in_array($value, [true, 1, '1', 'true', 'on', 'yes'], true) ? 1 : 0;
}

function queryInt($value): ?int
{
    return ($value === null || $value === '') ? null : (int) $value;
}
