import Button from 'react-bootstrap/Button'; 
import {Link, NavLink, useNavigate } from 'react-router-dom';



interface UsuarioActual {
  nombre?: string;
  username?: string;
  // agrega aquí otras propiedades si las necesitas
}

interface NavbarProps {
  usuarioActual?: UsuarioActual;
  logout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({usuarioActual, logout}) => {
    const navigate = useNavigate();
    const handleLogout = () => {
      logout();
      navigate('/login');
    };

  const navLinks = [
    { to: "/dashboard", text: "Dashboard" },
    { to: "/tickets", text: "Tickets" },
    { to: "/clientes", text: "Clientes" },
    { to: "/centros-costo", text: "Centros de Costo" },
    { to: "/roles", text: "Roles" }, 
  ];

  return (
    <nav className="navbar navbar-expand-lg navbar-ligth bg-indigo-600 shadow-sm">
        <div className="container-fluid">
          <Link to="/dashboard" className="navbar-brand fw-bold fs-4">
            MexaneTickets
          </Link>
          <button 
            className="navbar-toggler" 
            type="button" 
            data-bs-toggle="collapse" 
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
                        isActive ? 'active bg-indigo-700' : 'text-gray-300 hover:bg-indigo-700'
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
                <span className="navbar-text me-3 text-sm text-dark">
                  Hola, {usuarioActual.nombre || usuarioActual.username}
                </span>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </nav>
  )
}

export default Navbar