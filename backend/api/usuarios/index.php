<?php
/**
 * Endpoint: /backend/api/usuarios/index.php
 *
 * GET    ?id=5     -> devuelve un usuario puntual (requiere sesión)
 * GET    (sin id)  -> devuelve la lista completa (requiere sesión)
 * POST             -> crea un usuario. Público (autorregistro) o
 *                     privilegiado (administrador/dueño creando a alguien)
 * PUT    ?id=5     -> actualiza un usuario existente (requiere permisos)
 * DELETE ?id=5     -> elimina un usuario (requiere permisos)
 *
 * Reglas de rango (ver README, sección "Roles y permisos"):
 *   - usuario:        solo puede leer (GET). No puede crear, editar ni borrar.
 *   - administrador:  puede crear, editar y borrar usuarios de rango "usuario".
 *                     No puede tocar administradores ni al dueño.
 *   - dueño:          puede crear, editar y borrar a cualquiera, y es el
 *                     único que puede asignar o quitar el rango "administrador".
 *   - Mientras no exista ningún "dueño", la próxima cuenta que se registre
 *     se vuelve "dueño" automáticamente, sin importar quién la haya creado.
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';

$conexion = obtenerConexion();
$metodo = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int) $_GET['id'] : null;

switch ($metodo) {
    case 'GET':
        exigirSesion($conexion);
        if ($id) {
            obtenerUsuarioPorId($conexion, $id);
        } else {
            listarUsuarios($conexion);
        }
        break;

    case 'POST':
        crearUsuario($conexion);
        break;

    case 'PUT':
        if (!$id) {
            responderJson(400, ['error' => 'Falta el parámetro id para actualizar.']);
        }
        actualizarUsuario($conexion, $id);
        break;

    case 'DELETE':
        if (!$id) {
            responderJson(400, ['error' => 'Falta el parámetro id para eliminar.']);
        }
        eliminarUsuario($conexion, $id);
        break;

    default:
        responderJson(400, ['error' => 'Método HTTP no soportado.']);
}

/** Corta la ejecución con 401 si la solicitud no trae una sesión válida. */
function exigirSesion(PDO $conexion): array
{
    $autenticado = usuarioAutenticado($conexion);
    if (!$autenticado) {
        responderJson(401, ['error' => 'Necesitás iniciar sesión para ver esta información.']);
    }
    return $autenticado;
}

/** GET /usuarios — lista todos los usuarios (sin exponer password_hash). */
function listarUsuarios(PDO $conexion): void
{
    $consulta = $conexion->query(
        'SELECT u.id, u.nombre, u.apellido, u.email, u.fecha_registro, r.nombre_rol
         FROM usuarios u
         JOIN roles r ON r.id = u.rol_id
         ORDER BY u.fecha_registro DESC'
    );
    $usuarios = $consulta->fetchAll();

    responderJson(200, ['usuarios' => $usuarios]);
}

/** GET /usuarios/:id — devuelve un usuario puntual. */
function obtenerUsuarioPorId(PDO $conexion, int $id): void
{
    $consulta = $conexion->prepare(
        'SELECT u.id, u.nombre, u.apellido, u.email, u.fecha_registro, r.nombre_rol
         FROM usuarios u
         JOIN roles r ON r.id = u.rol_id
         WHERE u.id = :id'
    );
    $consulta->execute(['id' => $id]);
    $usuario = $consulta->fetch();

    if (!$usuario) {
        responderJson(404, ['error' => 'Usuario no encontrado.']);
    }

    responderJson(200, ['usuario' => $usuario]);
}

/**
 * POST /usuarios — crea un usuario.
 *
 * - Si es el primer registro de toda la base, se vuelve "dueño"
 *   automáticamente (autorregistro público, sin sesión).
 * - Si quien llama no tiene sesión (o su sesión no es de dueño), el nuevo
 *   usuario siempre se crea con rango "usuario", sin importar qué rol
 *   venga en el cuerpo de la solicitud (evita que alguien se autoasigne
 *   un rango mayor).
 * - Si quien llama es el dueño, puede elegir el rango ("usuario" o
 *   "administrador") mediante el campo "rol" del cuerpo.
 */
function crearUsuario(PDO $conexion): void
{
    $datos = leerCuerpoJson();
    $errores = validarDatosUsuario($datos, true);

    if (!empty($errores)) {
        responderJson(400, ['errores' => $errores]);
    }

    $consultaExiste = $conexion->prepare('SELECT id FROM usuarios WHERE email = :email');
    $consultaExiste->execute(['email' => $datos['email']]);
    if ($consultaExiste->fetch()) {
        responderJson(400, ['errores' => ['Ya existe un usuario registrado con ese email.']]);
    }

    asegurarRolesBase($conexion);

    if (!existeDueno($conexion)) {
        // Todavía no hay dueño: esta cuenta se vuelve dueño automáticamente,
        // aunque ya hubiera usuarios comunes cargados de antes.
        $rolAsignado = idDeRol($conexion, 'dueño');
    } else {
        $autenticado = usuarioAutenticado($conexion);
        $rolSolicitado = $datos['rol'] ?? 'usuario';

        if ($autenticado && $autenticado['rol'] === 'dueño' && in_array($rolSolicitado, ['usuario', 'administrador'], true)) {
            // Solo el dueño puede elegir el rango del nuevo usuario.
            $rolAsignado = idDeRol($conexion, $rolSolicitado);
        } else {
            // Autorregistro público, o creación por un administrador: siempre "usuario".
            $rolAsignado = idDeRol($conexion, 'usuario');
        }
    }

    $hash = password_hash($datos['password'], PASSWORD_BCRYPT);

    $insercion = $conexion->prepare(
        'INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id)
         VALUES (:nombre, :apellido, :email, :password_hash, :rol_id)'
    );
    $insercion->execute([
        'nombre'        => trim($datos['nombre']),
        'apellido'      => trim($datos['apellido']),
        'email'         => trim($datos['email']),
        'password_hash' => $hash,
        'rol_id'        => $rolAsignado,
    ]);

    responderJson(201, [
        'mensaje' => 'Usuario creado correctamente.',
        'id'      => (int) $conexion->lastInsertId(),
    ]);
}

/**
 * PUT /usuarios/:id — actualiza nombre, apellido, email y, si corresponde,
 * el rango del usuario.
 */
function actualizarUsuario(PDO $conexion, int $id): void
{
    $autenticado = exigirSesion($conexion);
    $datos = leerCuerpoJson();
    $errores = validarDatosUsuario($datos, false);

    if (!empty($errores)) {
        responderJson(400, ['errores' => $errores]);
    }

    $rolObjetivo = rolDeUsuario($conexion, $id);
    if ($rolObjetivo === null) {
        responderJson(404, ['error' => 'Usuario no encontrado.']);
    }

    if ($autenticado['rol'] === 'usuario') {
        responderJson(403, ['error' => 'No tenés permisos para editar usuarios.']);
    }

    if ($autenticado['rol'] === 'administrador' && $rolObjetivo !== 'usuario') {
        responderJson(403, ['error' => 'Solo el dueño puede modificar cuentas de administrador.']);
    }

    // Determinar el rango final. Por defecto no cambia.
    $rolIdFinal = idDeRol($conexion, $rolObjetivo);

    if ($autenticado['rol'] === 'dueño' && $rolObjetivo !== 'dueño' && !empty($datos['rol'])) {
        if (!in_array($datos['rol'], ['usuario', 'administrador'], true)) {
            responderJson(400, ['errores' => ['El rango indicado no es válido.']]);
        }
        $rolIdFinal = idDeRol($conexion, $datos['rol']);
    }

    $actualizacion = $conexion->prepare(
        'UPDATE usuarios SET nombre = :nombre, apellido = :apellido, email = :email, rol_id = :rol_id WHERE id = :id'
    );
    $actualizacion->execute([
        'nombre'   => trim($datos['nombre']),
        'apellido' => trim($datos['apellido']),
        'email'    => trim($datos['email']),
        'rol_id'   => $rolIdFinal,
        'id'       => $id,
    ]);

    responderJson(200, ['mensaje' => 'Usuario actualizado correctamente.']);
}

/** DELETE /usuarios/:id — elimina un usuario, respetando la jerarquía de rangos. */
function eliminarUsuario(PDO $conexion, int $id): void
{
    $autenticado = exigirSesion($conexion);

    $rolObjetivo = rolDeUsuario($conexion, $id);
    if ($rolObjetivo === null) {
        responderJson(404, ['error' => 'Usuario no encontrado.']);
    }

    if ($autenticado['rol'] === 'usuario') {
        responderJson(403, ['error' => 'No tenés permisos para eliminar usuarios.']);
    }

    if ($autenticado['rol'] === 'administrador' && $rolObjetivo !== 'usuario') {
        responderJson(403, ['error' => 'Solo el dueño puede eliminar cuentas de administrador.']);
    }

    if ($autenticado['rol'] === 'dueño' && $autenticado['id'] === $id) {
        responderJson(400, ['error' => 'El dueño no puede eliminar su propia cuenta.']);
    }

    $eliminacion = $conexion->prepare('DELETE FROM usuarios WHERE id = :id');
    $eliminacion->execute(['id' => $id]);

    responderJson(200, ['mensaje' => 'Usuario eliminado correctamente.']);
}
