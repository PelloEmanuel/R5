import { PROVEEDORES_OAUTH, urlInicioOAuth } from '../services/authService';

/**
 * Botones "Continuar con Google / GitHub / Discord".
 * Son enlaces normales (<a>) y no fetch: el flujo OAuth necesita que el
 * navegador entero viaje a la pantalla del proveedor y vuelva después.
 */
export function BotonesSociales({ texto = 'Iniciar sesión con' }) {
  return (
    <div className="mt-4">
      <div className="separador-o" role="separator">
        <span>o</span>
      </div>
      <div className="d-grid gap-2">
        {PROVEEDORES_OAUTH.map(({ clave, nombre, icono }) => (
          <a
            key={clave}
            href={urlInicioOAuth(clave)}
            className={`btn btn-social btn-social-${clave}`}
          >
            <i className={`bi ${icono} me-2`} aria-hidden="true"></i>
            {texto} {nombre}
          </a>
        ))}
      </div>
    </div>
  );
}
