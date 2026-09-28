import { useForm } from '../hooks/useForm';
import { validarRegistro } from '../hooks/validadores';
import { ErrorMessage } from './ErrorMessage';

/**
 * Formulario de registro de usuario.
 * Recibe onEnviar (async) y enviando (bool) para no manejar su propio
 * estado de carga: eso queda a cargo de quien lo use.
 */
export function UserForm({ onEnviar, enviando }) {
  const { valores, errores, manejarCambio, validarFormulario, reiniciarFormulario } = useForm(
    { nombre: '', apellido: '', email: '', password: '' },
    validarRegistro
  );

  async function manejarEnvio(evento) {
    evento.preventDefault();
    if (!validarFormulario()) return;

    await onEnviar(valores);
    reiniciarFormulario();
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

      <button type="submit" className="btn btn-primary" disabled={enviando}>
        {enviando ? 'Registrando...' : 'Registrar usuario'}
      </button>
    </form>
  );
}
