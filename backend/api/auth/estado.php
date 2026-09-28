<?php
/**
 * Endpoint: GET /backend/api/auth/estado.php
 * Público (no requiere sesión). Informa si ya existe un usuario con rango
 * "dueño", para que el frontend decida automáticamente si mostrar la
 * pantalla de configuración inicial (que crea al dueño) o el login normal.
 *
 * Se consulta por el rango y no por la cantidad de usuarios, así funciona
 * aunque la base ya tuviera usuarios comunes cargados de pruebas anteriores.
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';

$conexion = obtenerConexion();
asegurarRolesBase($conexion);

responderJson(200, ['existeDueño' => existeDueno($conexion)]);
