// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage'; 
import { useAuth } from './context/AuthContext'; 
import TicketsListPage from './pages/TicketsListPage'; 
import CrearTicketPage from './pages/CrearTicketPage'; 
import TicketDetailPage from './pages/TicketDetailPage';
import Navbar from './components/Navbar'; 
import GestionUsuariosPage from './pages/admin/GestionUsuariosPage'; 

// La interfaz que Navbar espera
interface UsuarioActualParaNavbar {
  nombre?: string;
  username?: string;
  roles?: string[];
  estaActivo?: boolean; // Asegurarse de que esta propiedad exista
}

// Componente de Layout Principal para rutas autenticadas
const MainLayout: React.FC = () => {
  const { usuarioActual, logout } = useAuth(); // Obtenemos el usuarioActual completo del AuthContext
  const navigate = useNavigate();

  // Mapear usuarioActual del AuthContext al tipo esperado por Navbar
  // Asegurándonos de pasar todas las propiedades necesarias, incluyendo estaActivo y roles.
  const usuarioNavbarProps: UsuarioActualParaNavbar | undefined = usuarioActual 
    ? { 
        nombre: usuarioActual.nombre, 
        username: usuarioActual.username,
        roles: usuarioActual.roles,      // Pasar roles
        estaActivo: usuarioActual.estaActivo // <-- ASEGURARSE DE PASAR ESTA PROPIEDAD
      } 
    : undefined;

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar 
        usuarioActual={usuarioNavbarProps} // Pasar el objeto mapeado
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

  // Si no está autenticado O si está autenticado pero no está activo, redirigir a login
  // Esto asegura que un usuario inactivo no pueda acceder a rutas protegidas.
  if (!isAuthenticated || (usuarioActual && !usuarioActual.estaActivo)) {
    // Podrías pasar un estado a la página de login para mostrar un mensaje específico
    // si es !usuarioActual.estaActivo
    return <Navigate to="/login" replace />;
  }

  // Verificación de roles si se proporcionan para la ruta
  if (roles && roles.length > 0) {
    const tieneRolRequerido = usuarioActual?.roles?.some(rolUsuario => roles.includes(rolUsuario));
    if (!tieneRolRequerido) {
      console.warn(`Usuario ${usuarioActual?.username} no tiene los roles requeridos: ${roles.join(', ')} para esta ruta.`);
      return <Navigate to="/dashboard" replace state={{ error: "No tienes permiso para acceder a esta página." }} />;
    }
  }

  return children ? <>{children}</> : <MainLayout />;
};

const DashboardPage = () => {
  const { usuarioActual } = useAuth();
  // const location = useLocation(); // Para leer el estado de error si se redirige aquí
  // const errorState = location.state as { error?: string };

  return (
    <div className="card shadow-sm">
      <div className="card-body p-4">
        {/* {errorState?.error && <Alert variant="danger">{errorState.error}</Alert>} */}
        <h1 className="card-title h3 mb-4">Dashboard</h1>
        {usuarioActual && (
          <div className="mb-3">
            <p className="mb-1">
              <span className="fw-medium">Bienvenido,</span> {usuarioActual.nombre || usuarioActual.username}!
            </p>
            <p className="mb-1"><span className="fw-medium">ID:</span> {usuarioActual.id}</p>
            <p className="mb-1"><span className="fw-medium">Email:</span> {usuarioActual.email}</p>
            <p className="mb-0"><span className="fw-medium">Roles:</span> {usuarioActual.roles.join(', ')}</p>
            <p className="mb-0"><span className="fw-medium">Activo:</span> {usuarioActual.estaActivo ? 'Sí' : 'No (Pendiente de activación)'}</p>
          </div>
        )}
        <p className="text-muted">
          Este es tu panel de control principal.
          {usuarioActual && !usuarioActual.estaActivo && 
            <span className="d-block text-warning mt-2">Tu cuenta está pendiente de activación por un administrador. Algunas funcionalidades pueden estar limitadas.</span>
          }
        </p>
      </div>
    </div>
  );
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
        <Route path="/tickets" element={<TicketsListPage />} /> 
        <Route path="/clientes" element={<ClientesListPagePlaceholder />} />
        <Route path="/centros-costo" element={<CentrosCostoListPagePlaceholder />} />
        
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
