<?php
/**
 * Endpoint: POST /backend/api/auth/login.php
 * Recibe { email, password } y devuelve un token de sesión si son correctos.
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responderJson(400, ['error' => 'Método HTTP no soportado.']);
}

$conexion = obtenerConexion();
$datos = leerCuerpoJson();

$email = trim($datos['email'] ?? '');
$password = $datos['password'] ?? '';

if (empty($email) || empty($password)) {
    responderJson(400, ['errores' => ['Email y contraseña son obligatorios.']]);
}

$consulta = $conexion->prepare(
    'SELECT u.id, u.nombre, u.apellido, u.email, u.password_hash, r.nombre_rol
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.email = :email'
);
$consulta->execute(['email' => $email]);
$usuario = $consulta->fetch();

// Se usa el mismo mensaje de error para email inexistente o password
// incorrecta, para no revelar si un email está registrado o no.
// Las cuentas creadas con Google / GitHub / Discord no tienen contraseña
// (password_hash es NULL): no pueden entrar por acá, y se responde igual.
if (!$usuario || $usuario['password_hash'] === null || !password_verify($password, $usuario['password_hash'])) {
    responderJson(401, ['error' => 'Email o contraseña incorrectos.']);
}

$token = crearSesion($conexion, (int) $usuario['id']);

// La password_hash nunca se envía al frontend.
responderJson(200, [
    'mensaje' => 'Inicio de sesión correcto.',
    'token'   => $token,
    'usuario' => [
        'id'       => (int) $usuario['id'],
        'nombre'   => $usuario['nombre'],
        'apellido' => $usuario['apellido'],
        'email'    => $usuario['email'],
        'rol'      => $usuario['nombre_rol'],
    ],
]);
