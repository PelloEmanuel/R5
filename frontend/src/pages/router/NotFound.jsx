import { Link } from 'react-router-dom';

/** Página mostrada cuando la ruta solicitada no existe. */
export function NotFound() {
  return (
    <div className="text-center py-5">
      <h1 className="display-5">404</h1>
      <p className="text-secondary mb-4">La página que buscás no existe.</p>
      <Link to="/" className="btn btn-primary">
        Volver al inicio
      </Link>
    </div>
  );
}
