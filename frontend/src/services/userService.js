import { API_BASE_URL } from './apiConfig';

async function procesarRespuesta(respuesta) {
  const cuerpo = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    const mensaje =
      cuerpo.error || (cuerpo.errores && cuerpo.errores.join(' ')) || 'Ocurrió un error inesperado.';
    throw new Error(mensaje);
  }

  return cuerpo;
}

/** Arma los headers comunes, incluyendo el token si se proporciona. */
function headersConToken(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** Obtiene la lista completa de usuarios. Requiere sesión iniciada. */
export async function obtenerUsuarios(token) {
  const respuesta = await fetch(`${API_BASE_URL}/usuarios/index.php`, {
    headers: headersConToken(token),
  });
  const cuerpo = await procesarRespuesta(respuesta);
  return cuerpo.usuarios;
}

/** Obtiene un usuario puntual por id. Requiere sesión iniciada. */
export async function obtenerUsuarioPorId(id, token) {
  const respuesta = await fetch(`${API_BASE_URL}/usuarios/index.php?id=${id}`, {
    headers: headersConToken(token),
  });
  const cuerpo = await procesarRespuesta(respuesta);
  return cuerpo.usuario;
}

/**
 * Crea un usuario nuevo.
 * - Autorregistro público: se llama sin token (datosUsuario no debe traer "rol").
 * - Creación privilegiada: el dueño puede mandar datosUsuario.rol
 *   ('usuario' | 'administrador'); cualquier otro llamador lo ignora el backend.
 */
export async function crearUsuario(datosUsuario, token = null) {
  const respuesta = await fetch(`${API_BASE_URL}/usuarios/index.php`, {
    method: 'POST',
    headers: headersConToken(token),
    body: JSON.stringify(datosUsuario),
  });
  return procesarRespuesta(respuesta);
}

/** Actualiza nombre, apellido, email y (si quien llama es el dueño) el rol. */
export async function actualizarUsuario(id, datosUsuario, token) {
  const respuesta = await fetch(`${API_BASE_URL}/usuarios/index.php?id=${id}`, {
    method: 'PUT',
    headers: headersConToken(token),
    body: JSON.stringify(datosUsuario),
  });
  return procesarRespuesta(respuesta);
}

/** Elimina un usuario. Requiere permisos según el rango de quien llama. */
export async function eliminarUsuario(id, token) {
  const respuesta = await fetch(`${API_BASE_URL}/usuarios/index.php?id=${id}`, {
    method: 'DELETE',
    headers: headersConToken(token),
  });
  return procesarRespuesta(respuesta);
}
