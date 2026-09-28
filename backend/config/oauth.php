<?php
/**
 * Configuración y funciones de "Iniciar sesión con Google / GitHub / Discord"
 * (flujo OAuth 2.0 "authorization code", implementado con cURL, sin librerías).
 *
 * Las credenciales (client id / client secret) NO van en este archivo:
 * se leen de backend/config/credenciales.local.php, que está en .gitignore.
 * Copiá credenciales.local.example.php como credenciales.local.php y completalo.
 */

// Valores por defecto para desarrollo local (XAMPP). Se pueden pisar desde
// credenciales.local.php definiendo las mismas constantes antes de este include.
$archivoCredenciales = __DIR__ . '/credenciales.local.php';
if (file_exists($archivoCredenciales)) {
    require_once $archivoCredenciales;
}

// URL pública de la carpeta "backend" (sin barra final).
if (!defined('BACKEND_URL')) {
    define('BACKEND_URL', 'http://localhost/R5/backend');
}
// URL del frontend de React (sin barra final). Al terminar el login, el
// navegador vuelve acá con el token de sesión.
if (!defined('FRONTEND_URL')) {
    define('FRONTEND_URL', 'http://localhost:5173');
}

/** URL a registrar como "Redirect URI / Callback URL" en cada proveedor. */
function urlCallbackOAuth(): string
{
    return BACKEND_URL . '/api/auth/oauth/callback.php';
}

/**
 * Catálogo de proveedores. Para agregar otro (por ejemplo Microsoft) basta
 * con sumar una entrada acá y un caso en obtenerPerfilOAuth().
 */
function proveedoresOAuth(): array
{
    $credenciales = defined('OAUTH_CREDENCIALES') ? OAUTH_CREDENCIALES : [];

    $base = [
        'google' => [
            'nombre'    => 'Google',
            'url_auth'  => 'https://accounts.google.com/o/oauth2/v2/auth',
            'url_token' => 'https://oauth2.googleapis.com/token',
            'scope'     => 'openid email profile',
        ],
        'github' => [
            'nombre'    => 'GitHub',
            'url_auth'  => 'https://github.com/login/oauth/authorize',
            'url_token' => 'https://github.com/login/oauth/access_token',
            'scope'     => 'read:user user:email',
        ],
        'discord' => [
            'nombre'    => 'Discord',
            'url_auth'  => 'https://discord.com/oauth2/authorize',
            'url_token' => 'https://discord.com/api/oauth2/token',
            'scope'     => 'identify email',
        ],
    ];

    foreach ($base as $clave => &$datos) {
        $datos['client_id']     = $credenciales[$clave]['client_id'] ?? '';
        $datos['client_secret'] = $credenciales[$clave]['client_secret'] ?? '';
    }

    return $base;
}

/**
 * Explica por qué un proveedor no está listo (para diagnosticar rápido la
 * configuración local). Devuelve un texto corto y sin datos sensibles.
 */
function motivoNoConfigurado(string $clave): string
{
    if (!file_exists(__DIR__ . '/credenciales.local.php')) {
        return 'No existe backend/config/credenciales.local.php (copiá credenciales.local.example.php con ese nombre).';
    }
    if (!defined('OAUTH_CREDENCIALES')) {
        return 'credenciales.local.php existe pero no define OAUTH_CREDENCIALES.';
    }
    $c = OAUTH_CREDENCIALES[$clave] ?? null;
    if ($c === null) {
        return "En credenciales.local.php falta la entrada '$clave'.";
    }
    if (trim($c['client_id'] ?? '') === '') {
        return "El client_id de '$clave' está vacío.";
    }
    return "El client_secret de '$clave' está vacío.";
}

/** Un proveedor está "configurado" si tiene client id y secret cargados. */
function proveedorConfigurado(array $proveedor): bool
{
    return $proveedor['client_id'] !== '' && $proveedor['client_secret'] !== '';
}

/**
 * Vuelve al frontend con el resultado. Se usa el fragmento (#) y no el query
 * string para que el token no viaje en logs del servidor ni en el header
 * Referer: el fragmento solo lo ve el navegador.
 */
function redirigirAlFrontend(array $parametros): void
{
    header('Location: ' . FRONTEND_URL . '/login#' . http_build_query($parametros));
    exit;
}

/** Vuelve al frontend con un mensaje de error legible. */
function redirigirConErrorOAuth(string $mensaje): void
{
    redirigirAlFrontend(['oauth_error' => $mensaje]);
}

/**
 * Llamada HTTP con cURL. Devuelve el JSON decodificado (array) o null si la
 * llamada falló. La verificación del certificado SSL queda SIEMPRE activa.
 */
function llamadaHttp(string $metodo, string $url, array $encabezados = [], ?array $formulario = null): ?array
{
    $curl = curl_init($url);
    $encabezados[] = 'Accept: application/json';
    // GitHub rechaza las solicitudes sin User-Agent.
    $encabezados[] = 'User-Agent: R5-Sistema-Usuarios';

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => $encabezados,
        CURLOPT_CUSTOMREQUEST  => $metodo,
    ]);
    if ($formulario !== null) {
        curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($formulario));
    }

    $respuesta = curl_exec($curl);
    $codigo = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($respuesta === false || $codigo < 200 || $codigo >= 300) {
        return null;
    }

    $datos = json_decode($respuesta, true);
    return is_array($datos) ? $datos : null;
}

/** Cambia el "code" recibido por un access token del proveedor. */
function intercambiarCodigoPorToken(array $proveedor, string $codigo): ?string
{
    $respuesta = llamadaHttp('POST', $proveedor['url_token'], [], [
        'client_id'     => $proveedor['client_id'],
        'client_secret' => $proveedor['client_secret'],
        'code'          => $codigo,
        'redirect_uri'  => urlCallbackOAuth(),
        'grant_type'    => 'authorization_code',
    ]);

    return $respuesta['access_token'] ?? null;
}

/**
 * Pide el perfil al proveedor y lo normaliza al mismo formato:
 *   ['uid' => string, 'email' => string, 'nombre' => string, 'apellido' => string]
 * Devuelve null si no se pudo obtener, o si el proveedor no entrega un email
 * VERIFICADO (sin eso no se puede vincular con seguridad a una cuenta existente).
 */
function obtenerPerfilOAuth(string $clave, string $accessToken): ?array
{
    $auth = ['Authorization: Bearer ' . $accessToken];

    switch ($clave) {
        case 'google':
            $p = llamadaHttp('GET', 'https://openidconnect.googleapis.com/v1/userinfo', $auth);
            if (!$p || empty($p['sub']) || empty($p['email']) || empty($p['email_verified'])) {
                return null;
            }
            return [
                'uid'      => (string) $p['sub'],
                'email'    => $p['email'],
                'nombre'   => $p['given_name'] ?? ($p['name'] ?? 'Usuario'),
                'apellido' => $p['family_name'] ?? '',
            ];

        case 'github':
            $p = llamadaHttp('GET', 'https://api.github.com/user', $auth);
            if (!$p || empty($p['id'])) {
                return null;
            }
            // El email del perfil puede ser privado: se busca el principal verificado.
            $emails = llamadaHttp('GET', 'https://api.github.com/user/emails', $auth) ?? [];
            $emailVerificado = null;
            foreach ($emails as $e) {
                if (!empty($e['primary']) && !empty($e['verified'])) {
                    $emailVerificado = $e['email'];
                    break;
                }
            }
            if (!$emailVerificado) {
                return null;
            }
            [$nombre, $apellido] = separarNombreCompleto($p['name'] ?? '', $p['login'] ?? 'Usuario');
            return [
                'uid'      => (string) $p['id'],
                'email'    => $emailVerificado,
                'nombre'   => $nombre,
                'apellido' => $apellido,
            ];

        case 'discord':
            $p = llamadaHttp('GET', 'https://discord.com/api/users/@me', $auth);
            if (!$p || empty($p['id']) || empty($p['email']) || empty($p['verified'])) {
                return null;
            }
            [$nombre, $apellido] = separarNombreCompleto(
                $p['global_name'] ?? '',
                $p['username'] ?? 'Usuario'
            );
            return [
                'uid'      => (string) $p['id'],
                'email'    => $p['email'],
                'nombre'   => $nombre,
                'apellido' => $apellido,
            ];
    }

    return null;
}

/** "Ana María Pérez" -> ['Ana', 'María Pérez']. Si está vacío usa el alias. */
function separarNombreCompleto(string $nombreCompleto, string $alias): array
{
    $nombreCompleto = trim($nombreCompleto);
    if ($nombreCompleto === '') {
        return [mb_substr($alias, 0, 60), ''];
    }
    $partes = preg_split('/\s+/', $nombreCompleto, 2);
    return [mb_substr($partes[0], 0, 60), mb_substr($partes[1] ?? '', 0, 60)];
}

/**
 * Devuelve el id del usuario local asociado a esa cuenta del proveedor,
 * creándolo o vinculándolo si hace falta:
 *   1. Ya entró antes con ese proveedor      -> se usa esa cuenta.
 *   2. Existe un usuario con el mismo email  -> se vincula (el email viene
 *      verificado por el proveedor).
 *   3. No existe                             -> se crea sin contraseña.
 *      Sigue la regla del sistema: si todavía no hay dueño, esta cuenta lo será.
 */
function usuarioLocalDesdeOAuth(PDO $conexion, string $clave, array $perfil): int
{
    $busqueda = $conexion->prepare(
        'SELECT usuario_id FROM cuentas_oauth WHERE proveedor = :proveedor AND proveedor_uid = :uid'
    );
    $busqueda->execute(['proveedor' => $clave, 'uid' => $perfil['uid']]);
    $fila = $busqueda->fetch();
    if ($fila) {
        return (int) $fila['usuario_id'];
    }

    $porEmail = $conexion->prepare('SELECT id FROM usuarios WHERE email = :email');
    $porEmail->execute(['email' => $perfil['email']]);
    $existente = $porEmail->fetch();

    if ($existente) {
        $usuarioId = (int) $existente['id'];
    } else {
        asegurarRolesBase($conexion);
        $rolId = idDeRol($conexion, existeDueno($conexion) ? 'usuario' : 'dueño');

        $insercion = $conexion->prepare(
            'INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id)
             VALUES (:nombre, :apellido, :email, NULL, :rol_id)'
        );
        $insercion->execute([
            'nombre'   => $perfil['nombre'],
            'apellido' => $perfil['apellido'],
            'email'    => $perfil['email'],
            'rol_id'   => $rolId,
        ]);
        $usuarioId = (int) $conexion->lastInsertId();
    }

    $vinculo = $conexion->prepare(
        'INSERT INTO cuentas_oauth (usuario_id, proveedor, proveedor_uid)
         VALUES (:usuario_id, :proveedor, :uid)'
    );
    $vinculo->execute(['usuario_id' => $usuarioId, 'proveedor' => $clave, 'uid' => $perfil['uid']]);

    return $usuarioId;
}
