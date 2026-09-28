import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loading } from './Loading';

/** Envuelve una ruta exclusiva del rango administrador. */
export function AdminRoute({ children }) {
  const { usuario, cargandoSesion, estaAutenticado } = useAuth();

  if (cargandoSesion) {
    return <Loading mensaje="Verificando sesión..." />;
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  if (usuario.rol !== 'administrador') {
    return <Navigate to="/usuarios" replace />;
  }

  return children;
}
