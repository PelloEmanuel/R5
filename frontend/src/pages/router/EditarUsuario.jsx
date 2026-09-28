import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { obtenerUsuarioPorId, actualizarUsuario } from '../../services/userService';
import { UserManageForm } from '../../components/UserManageForm';
import { Loading } from '../../components/Loading';
import { ErrorMessage } from '../../components/ErrorMessage';

/** Página de edición de usuarios para el administrador (solo rango "usuario"). */
export function EditarUsuario() {
  const { id } = useParams();
  const { token } = useAuth();
  const navegar = useNavigate();

  const [usuarioObjetivo, setUsuarioObjetivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerUsuarioPorId(id, token)
      .then(setUsuarioObjetivo)
      .catch((err) => setError('No se pudo cargar el usuario: ' + err.message))
      .finally(() => setCargando(false));
  }, [id]);

  async function manejarGuardar(datos) {
    setGuardando(true);
    setError('');
    try {
      await actualizarUsuario(id, datos, token);
      navegar('/usuarios');
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <Loading mensaje="Cargando datos del usuario..." />;

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-6">
        <h2 className="mb-4">Editar usuario</h2>
        <ErrorMessage mensaje={error} />
        {usuarioObjetivo && (
          <UserManageForm
            usuarioInicial={usuarioObjetivo}
            onGuardar={manejarGuardar}
            guardando={guardando}
            textoBoton="Guardar cambios"
          />
        )}
      </div>
    </div>
  );
}
