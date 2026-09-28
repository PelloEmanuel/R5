import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Barra de navegación del Sistema 1 (React Router). */
export function Navbar() {
  const { estaAutenticado, usuario, logout } = useAuth();
  const navegar = useNavigate();

  async function manejarLogout() {
    await logout();
    navegar('/login');
  }

  function claseEnlace({ isActive }) {
    return `nav-link${isActive ? ' active fw-semibold' : ''}`;
  }

  return (
    <nav className="navbar navbar-expand-md navbar-dark bg-dark mb-4">
      <div className="container">
        <NavLink className="navbar-brand" to="/">
          Sistema de Usuarios
        </NavLink>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#menuPrincipal"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="menuPrincipal">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className={claseEnlace} to="/">
                Inicio
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={claseEnlace} to="/usuarios">
                Usuarios
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={claseEnlace} to="/registro">
                Registro
              </NavLink>
            </li>
            {estaAutenticado && usuario.rol === 'administrador' && (
              <li className="nav-item">
                <NavLink className={claseEnlace} to="/usuarios/nuevo">
                  Crear usuario
                </NavLink>
              </li>
            )}
          </ul>
          <ul className="navbar-nav">
            {estaAutenticado ? (
              <>
                <li className="nav-item nav-link text-white-50">
                  Hola, {usuario.nombre} <span className="text-white-50">({usuario.rol})</span>
                </li>
                <li className="nav-item">
                  <button className="btn btn-outline-light btn-sm mt-1" onClick={manejarLogout}>
                    Cerrar sesión
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <NavLink className={claseEnlace} to="/login">
                  Iniciar sesión
                </NavLink>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
