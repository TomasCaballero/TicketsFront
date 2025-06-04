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
    // navLinks.push({ to: "/roles", text: "Roles" }); 
    navLinks.push({ to: "/admin/usuarios", text: "Configuración" }); 
  }

  return (
    <NavbarBs expand="lg" bg="primary" variant="dark" className="shadow-sm">
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
                // Cuando se usa 'as={NavLink}', NavLink añade la clase 'active' automáticamente.
                // react-bootstrap/Nav.Link debería respetar esto.
                // Si necesitas clases adicionales siempre, puedes añadirlas como string.
                // Para clases condicionales basadas en isActive, NavLink lo maneja.
                // Si quieres sobreescribir o añadir a lo que hace NavLink:
                // className={({ isActive }) => `tu-clase-base ${isActive ? 'tu-clase-activa' : 'tu-clase-inactiva'}`}
                // Pero para Bootstrap, usualmente solo necesitas pasar las clases base de Bootstrap.
                // Las clases de Tailwind que tenías antes (text-gray-300, bg-indigo-700) no aplicarán directamente
                // a menos que tengas Tailwind configurado para trabajar sobre los componentes de react-bootstrap.
                // Vamos a usar las clases por defecto de Bootstrap para Nav.Link y el 'active' de NavLink.
                // Puedes añadir 'text-light' si quieres que el texto sea claro, por ejemplo.
                className="nav-item px-3 py-2 text-sm font-medium" // Clases base de Bootstrap
              >
                {link.text}
              </Nav.Link>
            ))}
          </Nav>
          <Nav>
            {usuarioActual && (
              <NavbarBs.Text className="me-3 text-light">
                Hola, {usuarioActual.nombre || usuarioActual.username}
                {!usuarioActual.estaActivo && <span className="ms-2 badge bg-warning text-dark">(Pendiente Activación)</span>}
              </NavbarBs.Text>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={logout}
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