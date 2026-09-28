import { Link } from 'react-router-dom';

/** Página principal del Sistema 1 (React Router). */
export function Home() {
  return (
    <div className="text-center py-5">
      <h1 className="mb-3">Sistema de Usuarios — React Router</h1>
      <p className="text-secondary mb-4">
        Este sistema utiliza React Router para navegar entre páginas sin recargar el navegador.
      </p>
      <div className="d-flex justify-content-center gap-3">
        <Link to="/usuarios" className="btn btn-primary">
          Ver usuarios
        </Link>
        <Link to="/registro" className="btn btn-outline-primary">
          Registrarme
        </Link>
      </div>
    </div>
  );
}
