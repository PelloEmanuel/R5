import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { crearUsuario } from '../../services/userService';
import { UserManageForm } from '../../components/UserManageForm';
import { ErrorMessage, SuccessMessage } from '../../components/ErrorMessage';

/**
 * Vista de creación de usuarios del dueño. A diferencia del administrador,
 * el dueño puede elegir el rango del nuevo usuario (usuario o administrador).
 */
export function VistaCrearUsuario({ onExito }) {
  const { token } = useAuth();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  async function manejarGuardar(datos) {
    setGuardando(true);
    setError('');
    setExito('');
    try {
      await crearUsuario(datos, token);
      setExito('Usuario creado correctamente.');
      setTimeout(onExito, 1200);
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
        <SuccessMessage mensaje={exito} />
        <UserManageForm
          mostrarSelectorRol
          onGuardar={manejarGuardar}
          guardando={guardando}
          textoBoton="Crear usuario"
        />
      </div>
    </div>
  );
}
