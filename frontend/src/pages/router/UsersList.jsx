import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { obtenerUsuarios, eliminarUsuario } from '../../services/userService';
import { UserCard } from '../../components/UserCard';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Loading } from '../../components/Loading';
import { ErrorMessage, EstadoVacio } from '../../components/ErrorMessage';

/**
 * Lista de usuarios del Sistema 1. Un administrador ve además un botón
 * para crear usuarios, y puede editar/eliminar únicamente cuentas de
 * rango "usuario" (el backend vuelve a validar esto de todas formas).
 */
export function UsersList() {
  const { token, usuario } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const navegar = useNavigate();

  const esAdministrador = usuario?.rol === 'administrador';

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    setCargando(true);
    setError('');
    try {
      const datos = await obtenerUsuarios(token);
      setUsuarios(datos);
    } catch (err) {
      setError('Error al obtener usuarios: ' + err.message);
    } finally {
      setCargando(false);
    }
  }

  /** Abre el diálogo de confirmación para el usuario elegido. */
  function pedirConfirmacion(id) {
    setUsuarioAEliminar(usuarios.find((u) => u.id === id) ?? null);
  }

  /** Elimina al usuario solo después de confirmar en el diálogo. */
  async function confirmarEliminacion() {
    setEliminando(true);
    setError('');
    try {
      await eliminarUsuario(usuarioAEliminar.id, token);
      setUsuarios((anteriores) => anteriores.filter((u) => u.id !== usuarioAEliminar.id));
    } catch (err) {
      setError('No se pudo eliminar: ' + err.message);
    } finally {
      setEliminando(false);
      setUsuarioAEliminar(null);
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <h2 className="mb-0">Usuarios registrados</h2>
        {esAdministrador && (
          <Link to="/usuarios/nuevo" className="btn btn-primary btn-sm">
            Crear usuario
          </Link>
        )}
      </div>

      {cargando && <Loading mensaje="Cargando usuarios..." />}
      <ErrorMessage mensaje={error} />

      {!cargando && !error && usuarios.length === 0 && (
        <EstadoVacio mensaje="No existen usuarios registrados todavía." />
      )}

      <ConfirmDialog
        abierto={usuarioAEliminar !== null}
        titulo="Eliminar usuario"
        mensaje={
          usuarioAEliminar
            ? `¿Seguro que querés eliminar a ${usuarioAEliminar.nombre} ${usuarioAEliminar.apellido}? Esta acción no se puede deshacer.`
            : ''
        }
        textoConfirmar="Sí, eliminar"
        textoProcesando="Eliminando..."
        peligro
        procesando={eliminando}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setUsuarioAEliminar(null)}
      />

      <div className="row g-3">
        {usuarios.map((u) => {
          // Un administrador solo puede editar/eliminar cuentas de rango "usuario".
          const puedeGestionar = esAdministrador && u.nombre_rol === 'usuario';
          return (
            <div className="col-12 col-sm-6 col-lg-4" key={u.id}>
              <UserCard
                usuario={u}
                onVerDetalle={(usr) => navegar(`/usuarios/${usr.id}`)}
                onEditar={puedeGestionar ? (usr) => navegar(`/usuarios/${usr.id}/editar`) : undefined}
                onEliminar={puedeGestionar ? pedirConfirmacion : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
