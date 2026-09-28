import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { consultarEstadoInicial } from './services/authService';
import { RegistroInicial } from './pages/estado/RegistroInicial';
import { SistemaEstado } from './pages/estado/SistemaEstado';
import { SistemaRouter } from './pages/router/SistemaRouter';
import { Loading } from './components/Loading';

/**
 * Decide automáticamente qué mostrar; la persona nunca elige un sistema.
 *
 *  1. Si todavía no existe ningún usuario en la base -> pantalla de
 *     configuración inicial (useState). Esa cuenta se vuelve dueño solo.
 *  2. Si ya hay sesión iniciada y el rol es "dueño"        -> Sistema useState.
 *  3. En cualquier otro caso (sin sesión, o sesión de
 *     usuario/administrador) -> Sistema React Router, que ya trae sus
 *     propias páginas públicas de login y registro.
 *
 * Cuando alguien inicia sesión como dueño desde el login del Sistema 1,
 * este componente lo nota en el siguiente render (porque "usuario" viene
 * del mismo AuthContext) y cambia solo al panel del dueño.
 */
function Portero() {
  const { estaAutenticado, usuario, cargandoSesion } = useAuth();
  const [existeDueño, setExisteDueño] = useState(null);

  useEffect(() => {
    consultarEstadoInicial().then(setExisteDueño);
  }, []);

  if (existeDueño === null || cargandoSesion) {
    return (
      <div className="selector-sistemas">
        <Loading mensaje="Cargando..." />
      </div>
    );
  }

  if (!existeDueño) {
    return <RegistroInicial onListo={() => setExisteDueño(true)} />;
  }

  if (estaAutenticado && usuario.rol === 'dueño') {
    return <SistemaEstado />;
  }

  return <SistemaRouter />;
}

export default function App() {
  return (
    <AuthProvider>
      <Portero />
    </AuthProvider>
  );
}
