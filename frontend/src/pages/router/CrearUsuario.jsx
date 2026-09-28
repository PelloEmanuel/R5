import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { crearUsuario } from '../../services/userService';
import { UserManageForm } from '../../components/UserManageForm';
import { ErrorMessage } from '../../components/ErrorMessage';

/**
 * Página de creación de usuarios para el administrador.
 * No muestra selector de rango: un administrador solo puede crear
 * cuentas de rango "usuario" (el backend lo fuerza igual).
 */
export function CrearUsuario() {
  const { token } = useAuth();
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const navegar = useNavigate();

  async function manejarGuardar(datos) {
    setGuardando(true);
    setError('');
    try {
      await crearUsuario(datos, token);
      navegar('/usuarios');
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-6">
        <h2 className="mb-4">Crear usuario</h2>
        <ErrorMessage mensaje={error} />
        <UserManageForm onGuardar={manejarGuardar} guardando={guardando} textoBoton="Crear usuario" />
      </div>
    </div>
  );
}
