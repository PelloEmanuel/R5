import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoginForm } from '../../components/LoginForm';
import { BotonesSociales } from '../../components/BotonesSociales';
import { ErrorMessage } from '../../components/ErrorMessage';

/**
 * Página de inicio de sesión, compartida por cualquier rango.
 * Si quien inicia sesión resulta ser el dueño, no hace falta redirigir
 * a ningún lado: el componente Portero (en App.jsx) detecta el rol y
 * cambia solo al panel del dueño en el siguiente render.
 */
export function Login() {
  const { login, estaAutenticado, errorOAuth } = useAuth();
  const navegar = useNavigate();

  async function manejarLogin(email, password) {
    const usuarioAutenticado = await login(email, password);
    if (usuarioAutenticado.rol !== 'dueño') {
      navegar('/usuarios');
    }
  }

  // Al volver de Google/GitHub/Discord ya hay sesión: no tiene sentido
  // quedarse en el formulario de login.
  if (estaAutenticado) {
    return <Navigate to="/usuarios" replace />;
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-5">
        <h2 className="mb-4">Iniciar sesión</h2>
        <ErrorMessage mensaje={errorOAuth} />
        <LoginForm onEnviar={manejarLogin} />
        <BotonesSociales />
      </div>
    </div>
  );
}
