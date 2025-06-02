// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import { useAuth } from './context/AuthContext';
import TicketsListPage from './pages/TicketsListPage'; 
import CrearTicketPage from './pages/CrearTicketPage'; // <-- IMPORTAR CrearTicketPage
import Navbar from './components/Navbar'; // <-- IMPORTAR TU COMPONENTE Navbar

// Asumiendo que UsuarioActual está definido en AuthContext o en tus tipos
interface UsuarioActualParaNavbar {
  nombre?: string;
  username?: string;
}

// Componente de Layout Principal para rutas autenticadas
const MainLayout: React.FC = () => {
  const { usuarioActual, logout } = useAuth();
  const navigate = useNavigate();

  // Mapear usuarioActual del AuthContext al tipo esperado por Navbar si es necesario
  const usuarioNavbar: UsuarioActualParaNavbar | undefined = usuarioActual 
    ? { nombre: usuarioActual.nombre, username: usuarioActual.username } 
    : undefined;

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar 
        usuarioActual={usuarioNavbar} 
        logout={() => {
          logout(); // logout del AuthContext
          navigate('/login');
        }} 
      />

      <main className="flex-grow-1 bg-light p-4 p-md-5">
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

const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <MainLayout />;
};

const DashboardPage = () => {
  const { usuarioActual } = useAuth();
  return (
    <div className="card shadow-sm">
      <div className="card-body p-4">
        <h1 className="card-title h3 mb-4">Dashboard</h1>
        {usuarioActual && (
          <div className="mb-3">
            <p className="mb-1">
              <span className="fw-medium">Bienvenido,</span> {usuarioActual.nombre || usuarioActual.username}!
            </p>
            <p className="mb-1"><span className="fw-medium">ID:</span> {usuarioActual.id}</p>
            <p className="mb-1"><span className="fw-medium">Email:</span> {usuarioActual.email}</p>
            <p className="mb-0"><span className="fw-medium">Roles:</span> {usuarioActual.roles.join(', ')}</p>
          </div>
        )}
        <p className="text-muted">
          Este es tu panel de control principal. Desde aquí podrás acceder a las diferentes
          funcionalidades del sistema de gestión de tickets.
        </p>
      </div>
    </div>
  );
};

// Componentes placeholder para otras páginas
const ClientesListPagePlaceholder = () => <div className="card shadow-sm"><div className="card-body p-4"><h1 className="card-title h3">Lista de Clientes</h1><p>Contenido...</p></div></div>;
const CentrosCostoListPagePlaceholder = () => <div className="card shadow-sm"><div className="card-body p-4"><h1 className="card-title h3">Lista de Centros de Costo</h1><p>Contenido...</p></div></div>;
const RolesPagePlaceholder = () => <div className="card shadow-sm"><div className="card-body p-4"><h1 className="card-title h3">Gestión de Roles</h1><p>Contenido...</p></div></div>;

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* <Route path="/register" element={<RegisterPage />} /> */}
      
      <Route element={<ProtectedRoute />}> 
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tickets/nuevo" element={<CrearTicketPage />} /> {/* <-- RUTA AÑADIDA */}
        <Route path="/tickets" element={<TicketsListPage />} /> 
        <Route path="/clientes" element={<ClientesListPagePlaceholder />} />
        <Route path="/centros-costo" element={<CentrosCostoListPagePlaceholder />} />
        <Route path="/roles" element={<RolesPagePlaceholder />} />
        {/* Aquí añadirás más rutas protegidas */}
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
