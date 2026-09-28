<?php
/**
 * Endpoint: GET /backend/api/auth/oauth/callback.php
 * Es la "Redirect URI" registrada en Google / GitHub / Discord. El proveedor
 * vuelve acá con ?code=...&state=... después de que la persona autoriza.
 *
 * Pasos:
 *   1. Valida el "state" (existe, no venció, se usa una sola vez).
 *   2. Cambia el "code" por un access token (llamada servidor a servidor
 *      con el client secret).
 *   3. Obtiene el perfil, busca/crea/vincula el usuario local.
 *   4. Emite el mismo token de sesión que login.php y vuelve al frontend.
 */

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/oauth.php';

$state = $_GET['state'] ?? '';
$codigo = $_GET['code'] ?? '';

if ($state === '') {
    redirigirConErrorOAuth('Solicitud de inicio de sesión inválida.');
}

$conexion = obtenerConexion();

// El state se consume (se borra) apenas se lee: no se puede reutilizar.
$consulta = $conexion->prepare(
    'SELECT proveedor FROM oauth_estados WHERE state = :state AND fecha_expiracion > NOW()'
);
$consulta->execute(['state' => $state]);
$fila = $consulta->fetch();
$conexion->prepare('DELETE FROM oauth_estados WHERE state = :state')->execute(['state' => $state]);

if (!$fila) {
    redirigirConErrorOAuth('La solicitud de inicio de sesión expiró o no es válida. Probá de nuevo.');
}

$clave = $fila['proveedor'];
$proveedores = proveedoresOAuth();
$proveedor = $proveedores[$clave] ?? null;

if (!$proveedor || !proveedorConfigurado($proveedor)) {
    redirigirConErrorOAuth('Proveedor de inicio de sesión no disponible.');
}

// La persona canceló o el proveedor devolvió un error (access_denied, etc.).
if (isset($_GET['error']) || $codigo === '') {
    redirigirConErrorOAuth("Se canceló el inicio de sesión con {$proveedor['nombre']}.");
}

$accessToken = intercambiarCodigoPorToken($proveedor, $codigo);
if (!$accessToken) {
    redirigirConErrorOAuth("No se pudo completar el inicio de sesión con {$proveedor['nombre']}.");
}

$perfil = obtenerPerfilOAuth($clave, $accessToken);
if (!$perfil) {
    redirigirConErrorOAuth(
        "{$proveedor['nombre']} no entregó un email verificado. " .
        'Verificá tu email en esa cuenta e intentá de nuevo.'
    );
}

try {
    $usuarioId = usuarioLocalDesdeOAuth($conexion, $clave, $perfil);
    $token = crearSesion($conexion, $usuarioId);
} catch (PDOException $e) {
    redirigirConErrorOAuth('No se pudo crear la sesión. Intentá de nuevo.');
}

redirigirAlFrontend(['oauth_token' => $token]);
