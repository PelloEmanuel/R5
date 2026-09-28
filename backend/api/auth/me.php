<?php
/**
 * Endpoint: GET /backend/api/auth/me.php
 * Valida el token enviado por header Authorization y devuelve los datos
 * del usuario dueño de ese token. Se usa para restaurar la sesión al
 * recargar la página, sin volver a pedir la contraseña.
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';

$conexion = obtenerConexion();
$autenticado = usuarioAutenticado($conexion);

if (!$autenticado) {
    responderJson(401, ['error' => 'Sesión inválida o expirada.']);
}

$consulta = $conexion->prepare(
    'SELECT u.id, u.nombre, u.apellido, u.email, r.nombre_rol
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.id = :id'
);
$consulta->execute(['id' => $autenticado['id']]);
$usuario = $consulta->fetch();

if (!$usuario) {
    responderJson(401, ['error' => 'Sesión inválida o expirada.']);
}

responderJson(200, [
    'usuario' => [
        'id'       => (int) $usuario['id'],
        'nombre'   => $usuario['nombre'],
        'apellido' => $usuario['apellido'],
        'email'    => $usuario['email'],
        'rol'      => $usuario['nombre_rol'],
    ],
]);
