// src/components/Navbar.tsx
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import NavbarBs from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';

const logoUrl = '/icono.png'; 

interface UsuarioActualParaNavbar {
  nombre?: string;
  username?: string;
  roles?: string[]; 
  estaActivo?: boolean;
}

interface NavbarProps {
  usuarioActual?: UsuarioActualParaNavbar | null;
  logout: () => void; 
}

const Navbar: React.FC<NavbarProps> = ({ usuarioActual, logout }) => {
  const navLinksBase = [
    { to: "/dashboard", text: "Dashboard" },
    { to: "/tickets", text: "Tickets" },
    { to: "/clientes", text: "Clientes" },
    { to: "/centros-costo", text: "Centros de Costo" },
  ];

  const esAdminYActivo = (usuarioActual?.estaActivo && usuarioActual?.roles?.includes("Administrador")) || false;

  const navLinks = [...navLinksBase];
  if (esAdminYActivo) {
    navLinks.push({ to: "/admin/usuarios", text: "Configuración" }); 
  }

  const handleLogoutClick = () => {
    // window.confirm() muestra un diálogo nativo del navegador
    if (window.confirm("¿Estás seguro de que deseas cerrar la sesión?")) {
      // Si el usuario hace clic en "Aceptar", se ejecuta la función de logout
      logout();
    }
    // Si hace clic en "Cancelar", no pasa nada.
  };

  return (
    <NavbarBs expand="lg" bg="light" variant="light" className="shadow-sm">
      <Container fluid>
        <NavbarBs.Brand as={Link} to="/dashboard" className="fw-bold fs-4 d-flex align-items-center">
          <img 
            src={logoUrl} 
            alt="MexaneTickets Logo" 
            height="30"
            className="me-2" 
          />
          MexaneTickets
        </NavbarBs.Brand>
        <NavbarBs.Toggle aria-controls="main-navbar-nav" />
        <NavbarBs.Collapse id="main-navbar-nav">
          <Nav className="me-auto">
            {navLinks.map((link) => (
              <Nav.Link
                key={link.to}
                as={NavLink}
                to={link.to}
                className="nav-item px-3 py-2 text-sm font-medium"
              >
                {link.text}
              </Nav.Link>
            ))}
          </Nav>
          <Nav>
            {usuarioActual && (
              <NavbarBs.Text className="me-3 text-dark">
                Hola, {usuarioActual.nombre || usuarioActual.username}
                {!usuarioActual.estaActivo && <span className="ms-2 badge bg-warning text-light">(Pendiente Activación)</span>}
              </NavbarBs.Text>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={handleLogoutClick} 
            >
              Cerrar Sesión
            </Button>
          </Nav>
        </NavbarBs.Collapse>
      </Container>
    </NavbarBs>
  );
};

export default Navbar;