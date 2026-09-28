-- =====================================================================
-- OPCIONAL. Deja la base de R3 ("sistema_usuarios") tal como estaba antes
-- de la migración de R5: quita las tablas de OAuth y vuelve a exigir
-- contraseña. Solo hace falta si ejecutaste migracion_R5_oauth.sql sobre
-- esa base. Ejecutar una sola vez desde phpMyAdmin, pestaña "SQL".
--
-- IMPORTANTE: primero borra los usuarios que entraron con Google/GitHub/
-- Discord (no tienen contraseña, y R3 no sabe manejarlos).
-- =====================================================================

USE sistema_usuarios;

DROP TABLE IF EXISTS oauth_estados;
DROP TABLE IF EXISTS cuentas_oauth;

DELETE FROM usuarios WHERE password_hash IS NULL;

ALTER TABLE usuarios MODIFY password_hash VARCHAR(255) NOT NULL;
