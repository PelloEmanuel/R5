<?php
/**
 * Endpoint: POST /backend/api/auth/logout.php
 * Invalida (borra) el token de sesión enviado en el header Authorization.
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responderJson(400, ['error' => 'Método HTTP no soportado.']);
}

$conexion = obtenerConexion();
$encabezados = getallheaders();
$authHeader = $encabezados['Authorization'] ?? $encabezados['authorization'] ?? '';

if (preg_match('/^Bearer\s+(.+)$/i', $authHeader, $coincidencias)) {
    $eliminacion = $conexion->prepare('DELETE FROM sesiones WHERE token = :token');
    $eliminacion->execute(['token' => $coincidencias[1]]);
}

responderJson(200, ['mensaje' => 'Sesión cerrada correctamente.']);
