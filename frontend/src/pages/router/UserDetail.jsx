import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { obtenerUsuarioPorId } from '../../services/userService';
import { Loading } from '../../components/Loading';
import { ErrorMessage } from '../../components/ErrorMessage';

/** Detalle de un usuario. El id llega desde la URL mediante useParams. */
export function UserDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setCargando(true);
    setError('');
    obtenerUsuarioPorId(id, token)
      .then(setUsuario)
      .catch((err) => setError('Usuario no encontrado: ' + err.message))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <Loading mensaje="Cargando datos del usuario..." />;
  if (error) return <ErrorMessage mensaje={error} />;

  const fecha = new Date(usuario.fecha_registro).toLocaleDateString('es-AR');

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h2 className="card-title">
          {usuario.nombre} {usuario.apellido}
        </h2>
        <p className="mb-1">
          <strong>Email:</strong> {usuario.email}
        </p>
        <p className="mb-1">
          <strong>Rol:</strong> {usuario.nombre_rol}
        </p>
        <p className="mb-3">
          <strong>Fecha de registro:</strong> {fecha}
        </p>
        <Link to="/usuarios" className="btn btn-outline-secondary btn-sm">
          Volver al listado
        </Link>
      </div>
    </div>
  );
}
