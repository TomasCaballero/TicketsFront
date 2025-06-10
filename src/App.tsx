// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage'; 
import { useAuth } from './context/AuthContext'; 
import TicketsListPage from './pages/TicketsListPage'; 
import CrearTicketPage from './pages/CrearTicketPage'; 
import TicketDetailPage from './pages/TicketDetailPage';
import EditarTicketPage from './pages/EditarTicketPage'; // <-- 1. IMPORTAR LA PÁGINA
import Navbar from './components/Navbar'; 
import GestionUsuariosPage from './pages/admin/GestionUsuariosPage'; 
import CentrosCostoListPage from './pages/CentrosCostoListPage';
import CentroDeCostoDetailPage from './pages/CentroDeCostoDetailPage';
import ClientesListPage from './pages/ClientesListPage';
import ClienteDetailPage from './pages/ClienteDetailPage';
import DashboardPage from './pages/DashboardPage';

// (El resto de las interfaces y componentes MainLayout, ProtectedRoute, DashboardPage, etc., no cambian)
// ...

interface UsuarioActualParaNavbar {
  nombre?: string;
  username?: string;
  roles?: string[];
  estaActivo?: boolean;
}

const MainLayout: React.FC = () => {
  const { usuarioActual, logout } = useAuth();
  const navigate = useNavigate();

  const usuarioNavbarProps: UsuarioActualParaNavbar | undefined = usuarioActual 
    ? { 
        nombre: usuarioActual.nombre, 
        username: usuarioActual.username,
        roles: usuarioActual.roles,
        estaActivo: usuarioActual.estaActivo
      } 
    : undefined;

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar 
        usuarioActual={usuarioNavbarProps}
        logout={() => {
          logout(); 
          navigate('/login');
        }} 
      />
      <main className="flex-grow-1 bg-light p-3">
        <Outlet /> 
      </main>
      <footer className="bg-white border-top">
        <div className="container-fluid text-center py-3 text-sm text-muted">
          &copy; {new Date().getFullYear()} MexaneTickets. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children?: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { isAuthenticated, isLoading, usuarioActual } = useAuth();

  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Verificando autenticación...</span>
        </div>
        <p className="ms-3 text-xl">Verificando autenticación...</p>
      </div>
    );
  }

  if (!isAuthenticated || (usuarioActual && !usuarioActual.estaActivo)) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0) {
    const tieneRolRequerido = usuarioActual?.roles?.some(rolUsuario => roles.includes(rolUsuario));
    if (!tieneRolRequerido) {
      console.warn(`Usuario ${usuarioActual?.username} no tiene los roles requeridos: ${roles.join(', ')} para esta ruta.`);
      return <Navigate to="/dashboard" replace state={{ error: "No tienes permiso para acceder a esta página." }} />;
    }
  }

  return children ? <>{children}</> : <MainLayout />;
};



const ClientesListPagePlaceholder = () => <div className="card shadow-sm"><div className="card-body p-4"><h1 className="card-title h3">Lista de Clientes</h1><p>Contenido...</p></div></div>;
const CentrosCostoListPagePlaceholder = () => <div className="card shadow-sm"><div className="card-body p-4"><h1 className="card-title h3">Lista de Centros de Costo</h1><p>Contenido...</p></div></div>;
const RolesPagePlaceholder = () => <div className="card shadow-sm"><div className="card-body p-4"><h1 className="card-title h3">Gestión de Roles</h1><p>Contenido...</p></div></div>;


function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route element={<ProtectedRoute />}> 
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tickets/nuevo" element={<CrearTicketPage />} />
        <Route path="/tickets/:ticketId" element={<TicketDetailPage />} /> 
        <Route path="/tickets/editar/:ticketId" element={<EditarTicketPage />} />
        <Route path="/tickets" element={<TicketsListPage />} /> 
        <Route path="/centros-costo" element={<CentrosCostoListPage />} />
        <Route path="/centros-costo/:centroDeCostoId" element={<CentroDeCostoDetailPage />} />
        <Route path="/clientes" element={<ClientesListPage />} />
        <Route path="/clientes/:clienteId" element={<ClienteDetailPage />} />
        
        <Route 
            path="/admin/usuarios" 
            element={
                <ProtectedRoute roles={['Administrador']}> 
                    <GestionUsuariosPage />
                </ProtectedRoute>
            } 
        />
        <Route 
            path="/roles" 
            element={
                <ProtectedRoute roles={['Administrador']}>
                    <RolesPagePlaceholder />
                </ProtectedRoute>
            } 
        /> 
      </Route>

      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        } 
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;