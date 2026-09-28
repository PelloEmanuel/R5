-- =====================================================================
-- OPCIONAL. Copia los usuarios que ya tenías en la base de R3
-- ("sistema_usuarios") hacia la base de R5 ("sistema_usuarios_r5"),
-- conservando ids, contraseñas y rangos. Las bases quedan separadas:
-- después de copiar, lo que hagas en una no afecta a la otra.
--
-- Requisitos: haber importado antes database/schema.sql (crea
-- sistema_usuarios_r5 vacía). Ejecutar una sola vez, desde phpMyAdmin,
-- pestaña "SQL" (sin elegir base o eligiendo cualquiera).
--
-- Solo copia usuarios: NO copia sesiones (habrá que volver a iniciar sesión).
-- Si en R5 todavía no hay ningún usuario, la copia trae también al dueño de R3.
-- =====================================================================

INSERT INTO sistema_usuarios_r5.usuarios
  (id, nombre, apellido, email, password_hash, rol_id, fecha_registro)
SELECT id, nombre, apellido, email, password_hash, rol_id, fecha_registro
FROM sistema_usuarios.usuarios;
