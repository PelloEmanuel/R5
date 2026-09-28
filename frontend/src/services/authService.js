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

/**
 * Consulta si ya existe algún usuario registrado (es decir, si ya existe
 * un dueño). No requiere sesión: se usa para decidir qué pantalla mostrar
 * antes de que la persona inicie sesión.
 */
export async function consultarEstadoInicial() {
  const respuesta = await fetch(`${API_BASE_URL}/auth/estado.php`);
  const cuerpo = await procesarRespuesta(respuesta);
  return cuerpo.existeDueño;
}

/** Envía email y contraseña; devuelve { token, usuario } si son correctos. */
export async function iniciarSesion(email, password) {
  const respuesta = await fetch(`${API_BASE_URL}/auth/login.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return procesarRespuesta(respuesta);
}

/** Proveedores externos disponibles para iniciar sesión. */
export const PROVEEDORES_OAUTH = [
  { clave: 'google', nombre: 'Google', icono: 'bi-google' },
  { clave: 'github', nombre: 'GitHub', icono: 'bi-github' },
  { clave: 'discord', nombre: 'Discord', icono: 'bi-discord' },
];

/**
 * URL a la que hay que NAVEGAR (no usar fetch) para empezar el login con un
 * proveedor. El backend redirige a Google/GitHub/Discord y, al terminar,
 * vuelve al frontend con el token de sesión en el fragmento de la URL.
 */
export function urlInicioOAuth(proveedor) {
  return `${API_BASE_URL}/auth/oauth/redirect.php?proveedor=${encodeURIComponent(proveedor)}`;
}

/** Avisa al backend que invalide el token actual. */
export async function cerrarSesion(token) {
  await fetch(`${API_BASE_URL}/auth/logout.php`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** Valida un token guardado y devuelve el usuario dueño, o null si no es válido. */
export async function validarSesion(token) {
  try {
    const respuesta = await fetch(`${API_BASE_URL}/auth/me.php`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!respuesta.ok) return null;
    const cuerpo = await respuesta.json();
    return cuerpo.usuario;
  } catch {
    return null;
  }
}
