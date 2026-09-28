import { useState } from 'react';
import { useForm } from '../hooks/useForm';
import { validarLogin } from '../hooks/validadores';
import { ErrorMessage } from './ErrorMessage';

/** Formulario de inicio de sesión. onEnviar recibe (email, password). */
export function LoginForm({ onEnviar }) {
  const { valores, errores, manejarCambio, validarFormulario } = useForm(
    { email: '', password: '' },
    validarLogin
  );
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setErrorGeneral('');
    if (!validarFormulario()) return;

    setEnviando(true);
    try {
      await onEnviar(valores.email, valores.password);
    } catch (error) {
      setErrorGeneral(error.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarEnvio} noValidate>
      <ErrorMessage mensaje={errorGeneral} />

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
        <ErrorMessage mensaje={errores.password} />
      </div>

      <button type="submit" className="btn btn-primary" disabled={enviando}>
        {enviando ? 'Ingresando...' : 'Iniciar sesión'}
      </button>
    </form>
  );
}
