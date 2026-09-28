const ETIQUETAS_ROL = {
  usuario: { texto: 'Usuario', clase: 'text-bg-secondary' },
  administrador: { texto: 'Administrador', clase: 'text-bg-primary' },
  dueño: { texto: 'Dueño', clase: 'text-bg-warning' },
};

/**
 * Tarjeta de usuario. Es un componente "tonto" (solo recibe datos y
 * funciones por props), reutilizado por ambos sistemas.
 */
export function UserCard({ usuario, onEliminar, onVerDetalle, onEditar }) {
  const fecha = new Date(usuario.fecha_registro).toLocaleDateString('es-AR');
  const etiquetaRol = ETIQUETAS_ROL[usuario.nombre_rol] ?? { texto: usuario.nombre_rol, clase: 'text-bg-secondary' };

  return (
    <div className="card shadow-sm h-100">
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-1">
          <h5 className="card-title mb-0">
            {usuario.nombre} {usuario.apellido}
          </h5>
          <span className={`badge ${etiquetaRol.clase}`}>{etiquetaRol.texto}</span>
        </div>
        <p className="card-subtitle text-secondary mb-2">{usuario.email}</p>
        <p className="small text-secondary mb-3">Registrado el {fecha}</p>

        <div className="mt-auto d-flex gap-2 flex-wrap">
          {onVerDetalle && (
            <button className="btn btn-outline-primary btn-sm" onClick={() => onVerDetalle(usuario)}>
              Ver detalle
            </button>
          )}
          {onEditar && (
            <button className="btn btn-outline-secondary btn-sm" onClick={() => onEditar(usuario)}>
              Editar
            </button>
          )}
          {onEliminar && (
            <button className="btn btn-outline-danger btn-sm" onClick={() => onEliminar(usuario.id)}>
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
