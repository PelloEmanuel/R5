import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearUsuario } from '../../services/userService';
import { UserForm } from '../../components/UserForm';
import { BotonesSociales } from '../../components/BotonesSociales';
import { ErrorMessage, SuccessMessage } from '../../components/ErrorMessage';

/** Página de registro del Sistema 1. */
export function Register() {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const navegar = useNavigate();

  async function manejarRegistro(datosUsuario) {
    setEnviando(true);
    setError('');
    setExito('');
    try {
      await crearUsuario(datosUsuario);
      setExito('Usuario creado correctamente.');
      setTimeout(() => navegar('/usuarios'), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-6">
        <h2 className="mb-4">Registro de usuario</h2>
        <ErrorMessage mensaje={error} />
        <SuccessMessage mensaje={exito} />
        <UserForm onEnviar={manejarRegistro} enviando={enviando} />
        <BotonesSociales texto="Registrarme con" />
      </div>
    </div>
  );
}
