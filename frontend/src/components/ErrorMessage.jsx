/** Mensaje de error visible, con estilo de alerta. */
export function ErrorMessage({ mensaje }) {
  if (!mensaje) return null;

  return (
    <div className="alert alert-danger" role="alert">
      {mensaje}
    </div>
  );
}

/** Mensaje de éxito visible, con estilo de alerta. */
export function SuccessMessage({ mensaje }) {
  if (!mensaje) return null;

  return (
    <div className="alert alert-success" role="alert">
      {mensaje}
    </div>
  );
}

/** Estado vacío: evita dejar al usuario frente a una pantalla en blanco. */
export function EstadoVacio({ mensaje }) {
  return (
    <div className="text-center text-secondary py-5 border rounded bg-light">
      {mensaje}
    </div>
  );
}
