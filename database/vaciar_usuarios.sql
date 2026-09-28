-- =====================================================================
-- Vacía TODOS los usuarios, sesiones y vínculos con Google/GitHub/Discord para volver al estado inicial.
-- Después de ejecutarlo, la app muestra la pantalla de "Configuración
-- inicial" y la primera cuenta que se registre queda como dueño.
--
-- No borra la base ni la tabla "roles": solo los datos de usuarios.
-- Ejecutar desde phpMyAdmin: elegir la base "sistema_usuarios_r5",
-- pestaña "SQL", pegar este contenido y presionar "Continuar".
-- =====================================================================

USE sistema_usuarios_r5;

DELETE FROM sesiones;
DELETE FROM cuentas_oauth;
DELETE FROM oauth_estados;
DELETE FROM usuarios;

ALTER TABLE sesiones AUTO_INCREMENT = 1;
ALTER TABLE cuentas_oauth AUTO_INCREMENT = 1;
ALTER TABLE usuarios AUTO_INCREMENT = 1;
