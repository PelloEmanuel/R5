import { useForm } from '../hooks/useForm';
import { validarGestionUsuario } from '../hooks/validadores';
import { ErrorMessage } from './ErrorMessage';

/**
 * Formulario de gestión de usuarios (crear o editar), usado por
 * administrador y dueño. Se diferencia de UserForm (registro público) en:
 *   - No siempre pide contraseña (solo al crear, nunca al editar).
 *   - Puede mostrar un selector de rango, exclusivo del dueño.
 */
export function UserManageForm({
  usuarioInicial = null,
  mostrarSelectorRol = false,
  onGuardar,
  guardando,
  textoBoton = 'Guardar',
}) {
  const esEdicion = usuarioInicial !== null;

  const { valores, errores, manejarCambio, validarFormulario } = useForm(
    {
      nombre: usuarioInicial?.nombre ?? '',
      apellido: usuarioInicial?.apellido ?? '',
      email: usuarioInicial?.email ?? '',
      password: '',
      rol: usuarioInicial?.nombre_rol ?? 'usuario',
    },
    (valoresActuales) => validarGestionUsuario(valoresActuales, { requierePassword: !esEdicion })
  );

  async function manejarEnvio(evento) {
    evento.preventDefault();
    if (!validarFormulario()) return;

    const datosAEnviar = {
      nombre: valores.nombre,
      apellido: valores.apellido,
      email: valores.email,
    };
    if (!esEdicion) datosAEnviar.password = valores.password;
    if (mostrarSelectorRol) datosAEnviar.rol = valores.rol;

    await onGuardar(datosAEnviar);
  }

  return (
    <form onSubmit={manejarEnvio} noValidate>
      <div className="mb-3">
        <label htmlFor="nombre" className="form-label">
          Nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          className={`form-control ${errores.nombre ? 'is-invalid' : ''}`}
          value={valores.nombre}
          onChange={manejarCambio}
        />
        <ErrorMessage mensaje={errores.nombre} />
      </div>

      <div className="mb-3">
        <label htmlFor="apellido" className="form-label">
          Apellido
        </label>
        <input
          id="apellido"
          name="apellido"
          type="text"
          className={`form-control ${errores.apellido ? 'is-invalid' : ''}`}
          value={valores.apellido}
          onChange={manejarCambio}
        />
        <ErrorMessage mensaje={errores.apellido} />
      </div>

      <div className="mb-3">
        <label htmlFor="email" className="form-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className={`form-control ${errores.email ? 'is-invalid' : ''}`}
          value={valores.email}
          onChange={manejarCambio}
        />
        <ErrorMessage mensaje={errores.email} />
      </div>

      {!esEdicion && (
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className={`form-control ${errores.password ? 'is-invalid' : ''}`}
            value={valores.password}
            onChange={manejarCambio}
          />
          <div className="form-text">Mínimo 8 caracteres, combinando letras y números.</div>
          <ErrorMessage mensaje={errores.password} />
        </div>
      )}

      {mostrarSelectorRol && (
        <div className="mb-3">
          <label htmlFor="rol" className="form-label">
            Rango
          </label>
          <select id="rol" name="rol" className="form-select" value={valores.rol} onChange={manejarCambio}>
            <option value="usuario">Usuario</option>
            <option value="administrador">Administrador</option>
          </select>
          <div className="form-text">Solo el dueño puede asignar el rango administrador.</div>
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={guardando}>
        {guardando ? 'Guardando...' : textoBoton}
      </button>
    </form>
  );
}
