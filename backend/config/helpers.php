<?php
/**
 * Funciones auxiliares reutilizadas por los distintos endpoints.
 */

/** Lee y decodifica el cuerpo JSON de la solicitud. */
function leerCuerpoJson(): array
{
    $contenido = file_get_contents('php://input');
    $datos = json_decode($contenido, true);
    return is_array($datos) ? $datos : [];
}

/** Envía una respuesta JSON con el código HTTP indicado y termina la ejecución. */
function responderJson(int $codigoHttp, array $cuerpo): void
{
    http_response_code($codigoHttp);
    echo json_encode($cuerpo);
    exit;
}

/** Valida formato de email de forma simple y segura. */
function emailValido(string $email): bool
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Valida los campos obligatorios de un usuario.
 * Devuelve un array de errores (vacío si todo es válido).
 */
function validarDatosUsuario(array $datos, bool $requierePassword): array
{
    $errores = [];

    if (empty(trim($datos['nombre'] ?? ''))) {
        $errores[] = 'El nombre es obligatorio.';
    }
    if (empty(trim($datos['apellido'] ?? ''))) {
        $errores[] = 'El apellido es obligatorio.';
    }
    if (empty(trim($datos['email'] ?? ''))) {
        $errores[] = 'El email es obligatorio.';
    } elseif (!emailValido($datos['email'])) {
        $errores[] = 'El email no tiene un formato válido.';
    }

    if ($requierePassword) {
        $password = $datos['password'] ?? '';
        if (strlen($password) < 8) {
            $errores[] = 'La contraseña debe tener al menos 8 caracteres.';
        } elseif (!preg_match('/[A-Za-z]/', $password) || !preg_match('/[0-9]/', $password)) {
            $errores[] = 'La contraseña debe combinar letras y números.';
        }
    }

    return $errores;
}

/**
 * Verifica el token de autorización enviado en el header "Authorization: Bearer <token>".
 * Devuelve ['id' => int, 'rol' => string] del usuario dueño del token,
 * o null si no hay token, es inválido o expiró.
 */
function usuarioAutenticado(PDO $conexion): ?array
{
    $encabezados = getallheaders();
    $authHeader = $encabezados['Authorization'] ?? $encabezados['authorization'] ?? '';

    if (!preg_match('/^Bearer\s+(.+)$/i', $authHeader, $coincidencias)) {
        return null;
    }

    $token = $coincidencias[1];

    $consulta = $conexion->prepare(
        'SELECT u.id, r.nombre_rol
         FROM sesiones s
         JOIN usuarios u ON u.id = s.usuario_id
         JOIN roles r ON r.id = u.rol_id
         WHERE s.token = :token AND s.fecha_expiracion > NOW()'
    );
    $consulta->execute(['token' => $token]);
    $fila = $consulta->fetch();

    return $fila ? ['id' => (int) $fila['id'], 'rol' => $fila['nombre_rol']] : null;
}

/** Devuelve el nombre del rol de un usuario puntual, o null si no existe. */
function rolDeUsuario(PDO $conexion, int $usuarioId): ?string
{
    $consulta = $conexion->prepare(
        'SELECT r.nombre_rol FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE u.id = :id'
    );
    $consulta->execute(['id' => $usuarioId]);
    $fila = $consulta->fetch();

    return $fila ? $fila['nombre_rol'] : null;
}

/** Devuelve el id numérico de un rol a partir de su nombre. */
function idDeRol(PDO $conexion, string $nombreRol): ?int
{
    $consulta = $conexion->prepare('SELECT id FROM roles WHERE nombre_rol = :nombre');
    $consulta->execute(['nombre' => $nombreRol]);
    $fila = $consulta->fetch();

    return $fila ? (int) $fila['id'] : null;
}

/**
 * Garantiza que los tres rangos base existan en la tabla "roles".
 * Sirve si la base quedó creada con una versión vieja del script
 * (por ejemplo, sin el rango "dueño"). No duplica nada si ya existen.
 */
function asegurarRolesBase(PDO $conexion): void
{
    $conexion->exec(
        "INSERT IGNORE INTO roles (nombre_rol) VALUES ('usuario'), ('administrador'), ('dueño')"
    );
}

/** Indica si ya existe al menos un usuario con rango "dueño". */
function existeDueno(PDO $conexion): bool
{
    $consulta = $conexion->query(
        "SELECT COUNT(*) AS total
         FROM usuarios u
         JOIN roles r ON r.id = u.rol_id
         WHERE r.nombre_rol = 'dueño'"
    );

    return (int) $consulta->fetch()['total'] > 0;
}

/**
 * Crea una sesión nueva (token aleatorio con expiración de 2 horas) para el
 * usuario indicado y devuelve el token. Lo usan tanto el login con
 * contraseña como el login con Google / GitHub / Discord.
 */
function crearSesion(PDO $conexion, int $usuarioId): string
{
    $token = bin2hex(random_bytes(32));
    $expiracion = date('Y-m-d H:i:s', strtotime('+2 hours'));

    $insercion = $conexion->prepare(
        'INSERT INTO sesiones (usuario_id, token, fecha_expiracion) VALUES (:usuario_id, :token, :expiracion)'
    );
    $insercion->execute([
        'usuario_id' => $usuarioId,
        'token'      => $token,
        'expiracion' => $expiracion,
    ]);

    return $token;
}
