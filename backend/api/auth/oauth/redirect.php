<?php
/**
 * Endpoint: GET /backend/api/auth/oauth/redirect.php?proveedor=google|github|discord
 * Es a donde apuntan los botones del frontend (navegación completa, no fetch).
 * Genera un "state" aleatorio de un solo uso (protección contra CSRF) y manda
 * al navegador a la pantalla de consentimiento del proveedor.
 */

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/oauth.php';

$clave = $_GET['proveedor'] ?? '';
$proveedores = proveedoresOAuth();

if (!isset($proveedores[$clave])) {
    redirigirConErrorOAuth('Proveedor de inicio de sesión desconocido.');
}

$proveedor = $proveedores[$clave];

if (!proveedorConfigurado($proveedor)) {
    redirigirConErrorOAuth(
        "El inicio de sesión con {$proveedor['nombre']} todavía no está configurado en el servidor. " .
        motivoNoConfigurado($clave)
    );
}

$conexion = obtenerConexion();

// Limpieza oportunista de estados vencidos.
$conexion->exec('DELETE FROM oauth_estados WHERE fecha_expiracion < NOW()');

$state = bin2hex(random_bytes(32));
$insercion = $conexion->prepare(
    'INSERT INTO oauth_estados (state, proveedor, fecha_expiracion)
     VALUES (:state, :proveedor, DATE_ADD(NOW(), INTERVAL 10 MINUTE))'
);
$insercion->execute(['state' => $state, 'proveedor' => $clave]);

$parametros = [
    'client_id'     => $proveedor['client_id'],
    'redirect_uri'  => urlCallbackOAuth(),
    'response_type' => 'code',
    'scope'         => $proveedor['scope'],
    'state'         => $state,
];
if ($clave === 'google') {
    // Que Google deje elegir la cuenta en lugar de entrar directo con la última.
    $parametros['prompt'] = 'select_account';
}

header('Location: ' . $proveedor['url_auth'] . '?' . http_build_query($parametros));
exit;
