import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { VistaLista } from './VistaLista';
import { VistaDetalle } from './VistaDetalle';
import { VistaCrearUsuario } from './VistaCrearUsuario';
import { VistaEditar } from './VistaEditar';

/**
 * Sistema 2: toda la navegación se resuelve con useState, sin React Router.
 * Es el panel exclusivo del dueño: solo se monta cuando App.jsx ya
 * confirmó que hay sesión iniciada con rol "dueño", así que acá no hace
 * falta pantalla de login ni verificación de permisos.
 * "vista" indica qué sección se muestra y "usuarioIdSeleccionado" qué
 * usuario ver o editar.
 */
export function SistemaEstado() {
  const [vista, setVista] = useState('lista');
  const [usuarioIdSeleccionado, setUsuarioIdSeleccionado] = useState(null);
  const { usuario, logout } = useAuth();

  function irADetalle(id) {
    setUsuarioIdSeleccionado(id);
    setVista('detalle');
  }

  function irAEditar(id) {
    setUsuarioIdSeleccionado(id);
    setVista('editar');
  }

  return (
    <div>
      <nav className="navbar navbar-expand-md navbar-dark bg-dark mb-4">
        <div className="container">
          <span className="navbar-brand">Sistema de Usuarios</span>
          <div className="d-flex gap-2 flex-wrap">
            <button
              className={`btn btn-sm ${vista === 'lista' ? 'btn-light' : 'btn-outline-light'}`}
              onClick={() => setVista('lista')}
            >
              Usuarios
            </button>
            <button
              className={`btn btn-sm ${vista === 'crear' ? 'btn-light' : 'btn-outline-light'}`}
              onClick={() => setVista('crear')}
            >
              Crear usuario
            </button>
            <span className="btn btn-sm btn-outline-light disabled">Hola, {usuario.nombre} (dueño)</span>
            <button className="btn btn-sm btn-outline-light" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="container pb-5">
        {vista === 'lista' && <VistaLista onVerDetalle={irADetalle} onEditar={irAEditar} />}
        {vista === 'detalle' && (
          <VistaDetalle id={usuarioIdSeleccionado} onVolver={() => setVista('lista')} />
        )}
        {vista === 'editar' && (
          <VistaEditar id={usuarioIdSeleccionado} onVolver={() => setVista('lista')} />
        )}
        {vista === 'crear' && <VistaCrearUsuario onExito={() => setVista('lista')} />}
      </main>
    </div>
  );
}
