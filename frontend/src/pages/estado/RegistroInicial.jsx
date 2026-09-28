import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { crearUsuario } from '../../services/userService';
import { UserForm } from '../../components/UserForm';
import { ErrorMessage } from '../../components/ErrorMessage';
import { BotonesSociales } from '../../components/BotonesSociales';

/**
 * Pantalla que se muestra únicamente cuando todavía no existe ningún
 * usuario en el sistema. Se construye con useState (sin React Router,
 * como corresponde al panel del dueño): la cuenta que se registre acá
 * se vuelve dueño automáticamente en el backend.
 *
 * Después de crearla, inicia sesión sola con esas mismas credenciales
 * para no pedirlas dos veces; el componente padre (App) detecta el rol
 * "dueño" y pasa solo, sin pedir nada más, al panel correspondiente.
 */
export function RegistroInicial({ onListo }) {
  const { login, errorOAuth } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  async function manejarRegistro(datosUsuario) {
    setEnviando(true);
    setError('');
    try {
      await crearUsuario(datosUsuario);
      await login(datosUsuario.email, datosUsuario.password);
      onListo();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="selector-sistemas">
      <div className="w-100" style={{ maxWidth: '28rem' }}>
        <h1 className="mb-2">Configuración inicial</h1>
        <p className="mb-4">
          Todavía no hay ningún usuario cargado. La primera cuenta que registres
          acá se convierte automáticamente en el <strong>dueño</strong> del sistema.
        </p>
        <ErrorMessage mensaje={error || errorOAuth} />
        <div className="card shadow-sm text-start">
          <div className="card-body">
            <UserForm onEnviar={manejarRegistro} enviando={enviando} />
            <BotonesSociales texto="Crear el dueño con" />
          </div>
        </div>
      </div>
    </div>
  );
}
