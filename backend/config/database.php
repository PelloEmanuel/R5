<?php
/**
 * Configuración de conexión a la base de datos.
 * Las credenciales NUNCA deben exponerse al frontend: solo viven aquí,
 * en el backend.
 */

// Ajustar estos valores según el entorno (XAMPP local u hosting).
define('DB_HOST', 'localhost');
define('DB_NAME', 'sistema_usuarios_r5');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

/**
 * Crea y devuelve una conexión PDO reutilizable.
 * Usa excepciones para poder capturar errores de conexión en un solo lugar.
 */
function obtenerConexion(): PDO
{
    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;

    $opciones = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false, // fuerza consultas preparadas reales
    ];

    try {
        return new PDO($dsn, DB_USER, DB_PASS, $opciones);
    } catch (PDOException $e) {
        // No se exponen detalles internos de la BBDD en la respuesta.
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo conectar a la base de datos.']);
        exit;
    }
}
