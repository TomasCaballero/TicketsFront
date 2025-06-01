// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate, Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage'; // Ajusta la ruta si es necesario
import { useAuth } from './context/AuthContext'; // Ajusta la ruta si es necesario
import Button from 'react-bootstrap/Button';
import TicketsListPage from './pages/TicketsListPage'; // Ajusta la ruta

// Componente de Layout Principal para rutas autenticadas
const MainLayout: React.FC = () => {
  const { usuarioActual, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define los enlaces de navegación
  const navLinks = [
    { to: "/dashboard", text: "Dashboard" },
    { to: "/tickets", text: "Tickets" },
    { to: "/clientes", text: "Clientes" },
    { to: "/centros-costo", text: "Centros de Costo" },
    { to: "/roles", text: "Roles" }, // Asumiendo que tendrás una página de gestión de roles
  ];

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Barra de Navegación Superior */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-indigo-600 shadow-sm"> {/* Usando clases de Bootstrap */}
        <div className="container-fluid">
          <Link to="/dashboard" className="navbar-brand fw-bold fs-4">
            MexaneTickets
          </Link>
          <button 
            className="navbar-toggler" 
            type="button" 
            data-bs-toggle="collapse" // Necesitarías el JS de Bootstrap para que el toggler funcione
            data-bs-target="#mainNavbar" 
            aria-controls="mainNavbar" 
            aria-expanded="false" 
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="mainNavbar">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {navLinks.map((link) => (
                <li className="nav-item" key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `nav-link px-3 py-2 rounded-md text-sm font-medium ${
                        isActive ? 'active bg-indigo-700 text-white' : 'text-gray-300 hover:bg-indigo-700 hover:text-white'
                      }`
                    }
                  >
                    {link.text}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="d-flex align-items-center">
              {usuarioActual && (
                <span className="navbar-text me-3 text-sm text-light">
                  Hola, {usuarioActual.nombre || usuarioActual.username}
                </span>
              )}
              <Button
                variant="danger" // Usando react-bootstrap Button
                size="sm"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido Principal de la Página */}
      <main className="flex-grow-1 bg-light p-4 p-md-5"> {/* Usando clases de Bootstrap */}
        <Outlet /> {/* Aquí se renderizarán las rutas anidadas */}
      </main>

      {/* Footer (Opcional) */}
      <footer className="bg-white border-top">
        <div className="container-fluid text-center py-3 text-sm text-muted">
          &copy; {new Date().getFullYear()} MexaneTickets. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};


// Componente para Rutas Protegidas
const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        {/* Puedes usar un spinner de Bootstrap aquí */}
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

// Componente placeholder para el Dashboard
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
            <p className="mb-1">
              <span className="fw-medium">ID:</span> {usuarioActual.id}
            </p>
            <p className="mb-1">
              <span className="fw-medium">Email:</span> {usuarioActual.email}
            </p>
            <p className="mb-0">
              <span className="fw-medium">Roles:</span> {usuarioActual.roles.join(', ')}
            </p>
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

// Componente placeholder para otras páginas (para que las rutas funcionen)
const TicketsListPage = () => <div className="card shadow-sm"><div className="card-body p-4"><h1 className="card-title h3">Lista de Tickets</h1><p>Contenido de la lista de tickets irá aquí...</p></div></div>;
const ClientesListPagePlaceholder = () => <div className="card shadow-sm"><div className="card-body p-4"><h1 className="card-title h3">Lista de Clientes</h1><p>Contenido de la lista de clientes irá aquí...</p></div></div>;
const CentrosCostoListPagePlaceholder = () => <div className="card shadow-sm"><div className="card-body p-4"><h1 className="card-title h3">Lista de Centros de Costo</h1><p>Contenido de la lista de centros de costo irá aquí...</p></div></div>;
const RolesPagePlaceholder = () => <div className="card shadow-sm"><div className="card-body p-4"><h1 className="card-title h3">Gestión de Roles</h1><p>Contenido de la gestión de roles irá aquí...</p></div></div>;


function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* <Route path="/register" element={<RegisterPage />} /> */}
      
      <Route element={<ProtectedRoute />}> 
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tickets" element={<TicketsListPage />} /> 
        <Route path="/clientes" element={<ClientesListPagePlaceholder />} />
        <Route path="/centros-costo" element={<CentrosCostoListPagePlaceholder />} />
        <Route path="/roles" element={<RolesPagePlaceholder />} />
        {/* Aquí añadirás más rutas protegidas que usarán MainLayout */}
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

// Se necesita importar Button de react-bootstrap en MainLayout
// Asumiré que LoginPage y AuthContext están en sus respectivos archivos y son importados correctamente.
// Para que el Navbar Toggler de Bootstrap funcione correctamente con data-bs-toggle,
// necesitarías importar el JavaScript de Bootstrap.
// En main.tsx o index.tsx: import 'bootstrap/dist/js/bootstrap.bundle.min.js';
// O manejar el estado del toggler con React.
// Aquí uso <NavLink> de react-router-dom para el manejo de la clase 'active'.

export default App;
