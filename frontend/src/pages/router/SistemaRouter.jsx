import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { AdminRoute } from '../../components/AdminRoute';
import { Home } from './Home';
import { UsersList } from './UsersList';
import { UserDetail } from './UserDetail';
import { Register } from './Register';
import { Login } from './Login';
import { CrearUsuario } from './CrearUsuario';
import { EditarUsuario } from './EditarUsuario';
import { NotFound } from './NotFound';

/**
 * Sistema 1: navegación basada en React Router. Lo usan los rangos
 * "usuario" y "administrador" (el "dueño" pasa automáticamente al
 * Sistema 2 apenas inicia sesión; ver App.jsx).
 */
export function SistemaRouter() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="container pb-5">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute>
                <UsersList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios/nuevo"
            element={
              <AdminRoute>
                <CrearUsuario />
              </AdminRoute>
            }
          />
          <Route
            path="/usuarios/:id/editar"
            element={
              <AdminRoute>
                <EditarUsuario />
              </AdminRoute>
            }
          />
          <Route
            path="/usuarios/:id"
            element={
              <ProtectedRoute>
                <UserDetail />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
