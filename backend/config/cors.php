<?php
/**
 * Encabezados comunes para todas las respuestas de la API.
 * Se incluye al principio de cada endpoint.
 */

// En un hosting real conviene reemplazar "*" por el dominio exacto del frontend.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// El navegador envía una solicitud OPTIONS antes de PUT/DELETE (preflight).
// Se responde vacío y con éxito para no bloquear la solicitud real.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
