<?php
/**
 * Plantilla de credenciales OAuth.
 *
 * 1. Copiar este archivo como  credenciales.local.php  (en esta misma carpeta).
 * 2. Completar client_id y client_secret de cada proveedor que quieras usar.
 *    Los que dejes vacíos muestran un aviso al hacer clic en su botón.
 *
 * credenciales.local.php está en .gitignore: nunca se sube al repositorio.
 * Los "client secret" son contraseñas: jamás van en el frontend.
 *
 * Al crear la aplicación en cada proveedor, la URL de redireccionamiento
 * (Redirect URI / Callback URL) debe ser EXACTAMENTE esta:
 *
 *   http://localhost/R5/backend/api/auth/oauth/callback.php
 */

// Solo si tu carpeta o puerto son distintos de los de por defecto:
// define('BACKEND_URL',  'http://localhost/R5/backend');
// define('FRONTEND_URL', 'http://localhost:5173');

define('OAUTH_CREDENCIALES', [
    'google' => [
        'client_id'     => '',
        'client_secret' => '',
    ],
    'github' => [
        'client_id'     => '',
        'client_secret' => '',
    ],
    'discord' => [
        'client_id'     => '',
        'client_secret' => '',
    ],
]);
