import { useEffect, useRef } from 'react';

/**
 * Diálogo de confirmación propio de la aplicación (reemplaza al confirm()
 * nativo del navegador).
 *
 * - Se cierra con el botón Cancelar, con la tecla Escape o haciendo clic
 *   en el fondo oscuro (salvo mientras se está procesando la acción).
 * - Al abrirse, el foco queda en "Cancelar" para evitar confirmar por error.
 */
export function ConfirmDialog({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  textoProcesando = 'Procesando...',
  peligro = false,
  procesando = false,
  onConfirmar,
  onCancelar,
}) {
  const botonCancelarRef = useRef(null);

  useEffect(() => {
    if (!abierto) return;

    botonCancelarRef.current?.focus();

    function manejarTecla(evento) {
      if (evento.key === 'Escape' && !procesando) onCancelar();
    }
    document.addEventListener('keydown', manejarTecla);
    return () => document.removeEventListener('keydown', manejarTecla);
  }, [abierto, procesando, onCancelar]);

  if (!abierto) return null;

  return (
    <div className="dialogo-fondo" onClick={() => !procesando && onCancelar()}>
      <div
        className="dialogo-caja"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialogo-titulo"
        aria-describedby="dialogo-mensaje"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className={`dialogo-icono ${peligro ? 'dialogo-icono-peligro' : ''}`} aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>

        <h3 id="dialogo-titulo" className="dialogo-titulo">
          {titulo}
        </h3>
        <p id="dialogo-mensaje" className="dialogo-mensaje">
          {mensaje}
        </p>

        <div className="dialogo-acciones">
          <button
            ref={botonCancelarRef}
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancelar}
            disabled={procesando}
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            className={`btn ${peligro ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirmar}
            disabled={procesando}
          >
            {procesando ? textoProcesando : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
