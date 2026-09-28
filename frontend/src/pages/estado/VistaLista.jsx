import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { obtenerUsuarios, eliminarUsuario, actualizarUsuario } from '../../services/userService';
import { UserCard } from '../../components/UserCard';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Loading } from '../../components/Loading';
import { ErrorMessage, EstadoVacio } from '../../components/ErrorMessage';

/**
 * Lista de usuarios del Sistema 2 (dueño).
 * El dueño puede editar y eliminar a cualquiera (menos eliminarse a sí
 * mismo) y es el único que puede ascender o degradar a un administrador,
 * con un botón directo en cada tarjeta.
 */
export function VistaLista({ onVerDetalle, onEditar }) {
  const { token, usuario } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

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

  /** Asciende un "usuario" a "administrador" o lo vuelve a degradar. */
  async function alternarRol(objetivo) {
    const nuevoRol = objetivo.nombre_rol === 'administrador' ? 'usuario' : 'administrador';
    try {
      await actualizarUsuario(
        objetivo.id,
        { nombre: objetivo.nombre, apellido: objetivo.apellido, email: objetivo.email, rol: nuevoRol },
        token
      );
      setUsuarios((anteriores) =>
        anteriores.map((u) => (u.id === objetivo.id ? { ...u, nombre_rol: nuevoRol } : u))
      );
    } catch (err) {
      setError('No se pudo cambiar el rango: ' + err.message);
    }
  }

  return (
    <div>
      <h2 className="mb-4">Usuarios registrados</h2>

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
          const esUnoMismo = u.id === usuario.id;
          const puedeCambiarRol = u.nombre_rol !== 'dueño' && !esUnoMismo;

          return (
            <div className="col-12 col-sm-6 col-lg-4" key={u.id}>
              <UserCard
                usuario={u}
                onVerDetalle={(usr) => onVerDetalle(usr.id)}
                onEditar={(usr) => onEditar(usr.id)}
                onEliminar={u.nombre_rol !== 'dueño' ? pedirConfirmacion : undefined}
              />
              {puedeCambiarRol && (
                <button
                  className="btn btn-sm btn-outline-secondary w-100 mt-2"
                  onClick={() => alternarRol(u)}
                >
                  {u.nombre_rol === 'administrador' ? 'Quitar rango de administrador' : 'Hacer administrador'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
