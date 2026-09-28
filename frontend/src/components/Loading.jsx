/** Indicador de carga reutilizable, con mensaje personalizable. */
export function Loading({ mensaje = 'Cargando...' }) {
  return (
    <div className="d-flex align-items-center gap-2 text-secondary py-4">
      <div className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
      <span>{mensaje}</span>
    </div>
  );
}
