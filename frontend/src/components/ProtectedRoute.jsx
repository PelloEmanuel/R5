import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loading } from './Loading';

/**
 * Envuelve una ruta que requiere sesión iniciada.
 * Si todavía se está validando el token, muestra un loader;
 * si no hay sesión, redirige a /login.
 */
export function ProtectedRoute({ children }) {
  const { estaAutenticado, cargandoSesion } = useAuth();

  if (cargandoSesion) {
    return <Loading mensaje="Verificando sesión..." />;
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
