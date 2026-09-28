import { createContext, useContext, useEffect, useState } from 'react';
import { iniciarSesion, cerrarSesion, validarSesion } from '../services/authService';

/**
 * Por qué Context: el usuario autenticado y el token deben estar
 * disponibles en componentes muy distintos entre sí (Navbar, rutas
 * protegidas, formularios) sin pasar props manualmente por cada nivel
 * intermedio ("prop drilling"). Es información realmente global.
 */
const AuthContext = createContext(null);

const CLAVE_TOKEN = 'sistemaUsuarios_token';

/**
 * Al volver de Google / GitHub / Discord, el backend redirige al frontend
 * con #oauth_token=... (éxito) o #oauth_error=... (fallo). Se lee UNA sola
 * vez al cargar el módulo (y no dentro de un efecto) porque React StrictMode
 * ejecuta los efectos dos veces en desarrollo y la segunda ya no encontraría
 * el fragmento. Luego se borra de la barra de direcciones para que el token
 * no quede visible ni en el historial.
 */
function leerResultadoOAuthDeLaUrl() {
  const parametros = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const token = parametros.get('oauth_token');
  const error = parametros.get('oauth_error');

  if (token || error) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  return { token, error };
}

const resultadoOAuthInicial = leerResultadoOAuthDeLaUrl();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [errorOAuth, setErrorOAuth] = useState(resultadoOAuthInicial.error || '');

  // Al montar la aplicación, si hay un token guardado en localStorage,
  // se valida contra el backend para restaurar la sesión sin pedir
  // la contraseña de nuevo.
  useEffect(() => {
    // Si se acaba de volver de un proveedor externo, ese token tiene prioridad.
    const tokenGuardado = resultadoOAuthInicial.token || localStorage.getItem(CLAVE_TOKEN);

    if (!tokenGuardado) {
      setCargandoSesion(false);
      return;
    }

    validarSesion(tokenGuardado).then((usuarioValidado) => {
      if (usuarioValidado) {
        localStorage.setItem(CLAVE_TOKEN, tokenGuardado);
        setUsuario(usuarioValidado);
        setToken(tokenGuardado);
      } else {
        localStorage.removeItem(CLAVE_TOKEN);
      }
      setCargandoSesion(false);
    });
  }, []);

  async function login(email, password) {
    const { token: tokenNuevo, usuario: usuarioAutenticado } = await iniciarSesion(email, password);
    // Solo el token viaja a localStorage; nunca la contraseña.
    localStorage.setItem(CLAVE_TOKEN, tokenNuevo);
    setToken(tokenNuevo);
    setUsuario(usuarioAutenticado);
    return usuarioAutenticado;
  }

  async function logout() {
    if (token) {
      await cerrarSesion(token);
    }
    localStorage.removeItem(CLAVE_TOKEN);
    setToken(null);
    setUsuario(null);
  }

  const valor = {
    usuario,
    token,
    estaAutenticado: usuario !== null,
    cargandoSesion,
    errorOAuth,
    limpiarErrorOAuth: () => setErrorOAuth(''),
    login,
    logout,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

/** Hook de acceso rápido al contexto de autenticación. */
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider.');
  }
  return contexto;
}
