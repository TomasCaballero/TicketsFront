import React, { useEffect, useState, useMemo } from 'react';
import apiClient from '../../services/apiClient';
import type { UsuarioAdminDto } from '../../types/admin';
import type { RolDto } from '../../types/roles';
import { Table, Button, Alert, Spinner, Badge, Card, Form, Row, Col } from 'react-bootstrap';
import { CheckCircleFill, XCircleFill, PersonPlusFill, PeopleFill, KeyFill, PencilSquare, Trash3, PlusCircle } from 'react-bootstrap-icons';
import ModalCrearRol from '../../components/admin/ModalCrearRol';
import ModalEditarPermisosRol from '../../components/admin/ModalEditarPermisosRol';
import ModalGestionarRolesUsuario from '../../components/admin/ModalGestionarRolesUsuario';
import ModalCrearUsuario from '../../components/admin/ModalCrearUsuario';

const GestionUsuariosPage: React.FC = () => {
  // Estados existentes (sin cambios)
  const [usuarios, setUsuarios] = useState<UsuarioAdminDto[]>([]);
  const [roles, setRoles] = useState<RolDto[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState<boolean>(true);
  const [loadingRoles, setLoadingRoles] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // --- 1. NUEVOS ESTADOS PARA LOS FILTROS ---
  const [searchUsuario, setSearchUsuario] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const [filterActivo, setFilterActivo] = useState('');
  const [searchRol, setSearchRol] = useState('');

  // Estados para modales (sin cambios)
  const [showCrearRolModal, setShowCrearRolModal] = useState<boolean>(false);
  const [showEditarPermisosModal, setShowEditarPermisosModal] = useState<boolean>(false);
  const [rolParaEditarPermisos, setRolParaEditarPermisos] = useState<RolDto | null>(null);
  const [showGestionarRolesModal, setShowGestionarRolesModal] = useState<boolean>(false);
  const [usuarioParaGestionarRoles, setUsuarioParaGestionarRoles] = useState<UsuarioAdminDto | null>(null);
  const [showCrearUsuarioModal, setShowCrearUsuarioModal] = useState<boolean>(false);


  // --- LÓGICA DE CARGA DE DATOS (tu código original, que es correcto) ---
  const fetchUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const response = await apiClient.get<UsuarioAdminDto[]>('/api/admin/usuarios');
      setUsuarios(response.data);
    } catch (err: any) {
      handleApiError(err, 'Error al cargar la lista de usuarios.');
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const response = await apiClient.get<RolDto[]>('/api/roles');
      setRoles(response.data.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    } catch (err: any) {
      handleApiError(err, 'Error al cargar la lista de roles.');
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    setError(null);
    setActionMessage(null);
    fetchUsuarios();
    fetchRoles();
  }, []);

  // --- 2. LÓGICA DE FILTRADO (useMemo) ---
  const filteredUsers = useMemo(() => {
    const searchTermLower = searchUsuario.toLowerCase();
    return usuarios
      .filter(u => {
        if (!searchTermLower) return true;
        const nombreCompleto = `${u.nombre} ${u.apellido}`;
        return (
          nombreCompleto.toLowerCase().includes(searchTermLower) ||
          u.email.toLowerCase().includes(searchTermLower) ||
          u.userName.toLowerCase().includes(searchTermLower)
        );
      })
      .filter(u => filterRol ? u.roles.includes(filterRol) : true)
      .filter(u => filterActivo ? u.estaActivo.toString() === filterActivo : true);
  }, [usuarios, searchUsuario, filterRol, filterActivo]);

  const filteredRoles = useMemo(() => {
    return roles.filter(r => r.nombre.toLowerCase().includes(searchRol.toLowerCase()));
  }, [roles, searchRol]);


  const handleApiError = (err: any, defaultMessage: string) => {
    setActionMessage(null);
    if (err.response && err.response.data) {
      const apiError = err.response.data;
      const errorMessage = typeof apiError === 'string'
        ? apiError
        : apiError.message || apiError.Message || (apiError.errors && JSON.stringify(apiError.errors)) || (apiError.Errors && apiError.Errors.map((e: any) => e.description || e).join(', ')) || defaultMessage;
      setError(errorMessage);
    } else {
      setError(defaultMessage);
    }
    console.error(defaultMessage, err);
  };

  const handleActivarUsuario = async (usuarioId: string, nombreUsuario: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas activar al usuario ${nombreUsuario}?`)) return;
    setActionMessage(null); setError(null);
    try {
      await apiClient.post(`/api/admin/usuarios/${usuarioId}/activar`);
      setActionMessage(`Usuario ${nombreUsuario} activado exitosamente.`);
      setUsuarios(prevUsuarios =>
        prevUsuarios.map(u => u.id === usuarioId ? { ...u, estaActivo: true } : u)
      );
    } catch (err: any) {
      handleApiError(err, `Error al activar al usuario ${nombreUsuario}.`);
    }
  };

  const handleDesactivarUsuario = async (usuarioId: string, nombreUsuario: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas desactivar al usuario ${nombreUsuario}? Esta acción impedirá su acceso.`)) return;
    setActionMessage(null); setError(null);
    try {
      await apiClient.post(`/api/admin/usuarios/${usuarioId}/desactivar`);
      setActionMessage(`Usuario ${nombreUsuario} desactivado exitosamente.`);
      setUsuarios(prevUsuarios =>
        prevUsuarios.map(u => u.id === usuarioId ? { ...u, estaActivo: false } : u)
      );
    } catch (err: any) {
      handleApiError(err, `Error al desactivar al usuario ${nombreUsuario}.`);
    }
  };

  const handleRolCreado = (nuevoRol: RolDto) => {
    setRoles(prevRoles => [...prevRoles, nuevoRol].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setActionMessage(`Rol "${nuevoRol.nombre}" creado exitosamente.`);
    setError(null);
  };

  const handleDeleteRol = async (rolId: string, rolNombre: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el rol "${rolNombre}"? Esto podría afectar a los usuarios que tengan este rol.`)) return;
    setActionMessage(null); setError(null);
    try {
      await apiClient.delete(`/api/roles/${rolId}`);
      setActionMessage(`Rol "${rolNombre}" eliminado exitosamente.`);
      setRoles(prevRoles => prevRoles.filter(rol => rol.id !== rolId));
      fetchUsuarios();
    } catch (err: any) {
      handleApiError(err, `Error al eliminar el rol "${rolNombre}". Asegúrate de que el rol no esté en uso o que el endpoint de eliminación esté implementado.`);
    }
  };

  const abrirModalEditarPermisos = (rolAEditar: RolDto) => {
    setRolParaEditarPermisos(rolAEditar);
    setShowEditarPermisosModal(true);
    setError(null);
    setActionMessage(null);
  };

  const handlePermisosDeRolActualizados = (nombreRol: string) => {
    setActionMessage(`Permisos para el rol "${nombreRol}" actualizados exitosamente.`);
  };

  const abrirModalGestionarRolesUsuario = (usuarioAEditar: UsuarioAdminDto) => {
    setUsuarioParaGestionarRoles(usuarioAEditar);
    setShowGestionarRolesModal(true);
    setError(null);
    setActionMessage(null);
  };

  const handleRolesDeUsuarioActualizados = (usuarioId: string) => {
    setActionMessage(`Roles para el usuario con ID ${usuarioId} actualizados exitosamente.`);
    fetchUsuarios();
  };

  // Callback cuando un usuario es creado desde el modal
  const handleUsuarioCreado = (nuevoUsuario: UsuarioAdminDto) => {
    setUsuarios(prevUsuarios => [...prevUsuarios, nuevoUsuario].sort((a, b) => (a.apellido + a.nombre).localeCompare(b.apellido + b.nombre)));
    setActionMessage(`Usuario "${nuevoUsuario.userName}" creado exitosamente.`);
    setError(null);
  };

  // --- Condición de carga original, que es la correcta ---
  if (loadingUsuarios || loadingRoles) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
        <span className="ms-3 fs-5">Cargando datos de administración...</span>
      </div>
    );
  }

  return (
    <>
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-light p-3 d-flex justify-content-between align-items-center">
          <h1 className="h4 mb-0 text-dark"><PeopleFill className="me-2" />Gestión de Usuarios</h1>
          {/* Modificar onClick del botón "Nuevo Usuario" */}
          <Button variant="success" onClick={() => { setError(null); setActionMessage(null); setShowCrearUsuarioModal(true); }}>
            <PersonPlusFill className="me-2" />
            Nuevo Usuario
          </Button>
        </Card.Header>
        {/* ... (resto de la tabla de usuarios sin cambios) ... */}
        <Card.Body>
          {error && !actionMessage && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
          {actionMessage && <Alert variant="success" onClose={() => setActionMessage(null)} dismissible>{actionMessage}</Alert>}

          {usuarios.length === 0 && !loadingUsuarios && (
            <p className="text-muted text-center">No hay usuarios para mostrar.</p>
          )}

          <div className="p-3 mb-4 border rounded bg-light">
            <Row className="g-3 align-items-end">
              <Col lg={5} md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold">Buscar Usuario</Form.Label>
                  <Form.Control type="text" placeholder="Nombre, apellido, email o username..." value={searchUsuario} onChange={e => setSearchUsuario(e.target.value)} />
                </Form.Group>
              </Col>
              <Col lg={3} md={6}>
                <Form.Group>
                  <Form.Label>Filtrar por Rol</Form.Label>
                  <Form.Select value={filterRol} onChange={e => setFilterRol(e.target.value)}>
                    <option value="">Todos</option>
                    {roles.map(rol => <option key={rol.id} value={rol.nombre}>{rol.nombre}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col lg={3} md={6}>
                <Form.Group>
                  <Form.Label>Filtrar por Estado</Form.Label>
                  <Form.Select value={filterActivo} onChange={e => setFilterActivo(e.target.value)}>
                    <option value="">Todos</option>
                    <option value="true">Activos</option>
                    <option value="false">Inactivos</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </div>

          {usuarios.length > 0 && (
            <Table striped bordered hover responsive="lg" className="align-middle text-sm">
              <thead className="table-light">
                <tr>
                  <th>Nombre Completo</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th className="text-center">Activo</th>
                  <th>Roles</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>{`${usuario.nombre} ${usuario.apellido}`.trim()}</td>
                    <td>{usuario.userName}</td>
                    <td>{usuario.email}</td>
                    <td className="text-center">{usuario.estaActivo ? <Badge bg="success">Sí</Badge> : <Badge bg="danger">No</Badge>}</td>
                    <td>{usuario.roles.join(', ') || <span className="text-muted">Sin roles</span>}</td>
                    <td className="text-center">
                      {usuario.estaActivo ? (
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => handleDesactivarUsuario(usuario.id, usuario.userName)}
                          title="Desactivar Usuario"
                          className="me-1 mb-1 mb-md-0"
                        >
                          Desactivar
                        </Button>
                      ) : (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleActivarUsuario(usuario.id, usuario.userName)}
                          title="Activar Usuario"
                          className="me-1 mb-1 mb-md-0"
                        >
                          Activar
                        </Button>
                      )}
                      <Button
                        variant="outline-info"
                        size="sm"
                        title="Gestionar Roles de Usuario"
                        onClick={() => abrirModalGestionarRolesUsuario(usuario)}
                      >
                        <KeyFill /> Roles
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
           {filteredUsers.length === 0 && <p className="text-center text-muted mt-3">No se encontraron usuarios que coincidan con los filtros.</p>}
        </Card.Body>
        {usuarios.length > 0 && (
          <Card.Footer className="bg-light text-muted text-sm p-2">
            Total de usuarios: {usuarios.length}
          </Card.Footer>
        )}
      </Card>

      <Card className="shadow-sm mt-4">
        {/* ... (Sección Gestión de Roles sin cambios) ... */}
        <Card.Header className="bg-light p-3 d-flex justify-content-between align-items-center">
          <h2 className="h4 mb-0 text-dark"><KeyFill className="me-2" />Gestión de Roles</h2>
          <Button variant="success" onClick={() => { setError(null); setActionMessage(null); setShowCrearRolModal(true); }}>
            <PlusCircle className="me-2" /> Crear Nuevo Rol
          </Button>
        </Card.Header>
        <Card.Body>
          {roles.length === 0 && !loadingRoles && (
            <p className="text-muted text-center">No hay roles definidos.</p>
          )}
          <Form.Group as={Col} md={4} className="mb-3">
            <Form.Label className="fw-bold">Buscar por Nombre de Rol</Form.Label>
            <Form.Control type="text" placeholder="Escriba para buscar..." value={searchRol} onChange={e => setSearchRol(e.target.value)} />
          </Form.Group>
          {roles.length > 0 && (
            <Table striped bordered hover responsive="sm" className="align-middle text-sm">
              <thead className="table-light">
                <tr>
                  <th>Nombre del Rol</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((rol) => (
                  <tr key={rol.id}>
                    <td>{rol.nombre}</td>
                    <td className="text-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1 mb-1 mb-md-0"
                        title="Editar Permisos del Rol"
                        onClick={() => abrirModalEditarPermisos(rol)}
                      >
                        <PencilSquare /> Permisos
                      </Button>
                      {rol.nombre.toLowerCase() !== "administrador" && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          title="Eliminar Rol"
                          onClick={() => handleDeleteRol(rol.id, rol.nombre)}
                        >
                          <Trash3 />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            
          )}
          {filteredRoles.length === 0 && <p className="text-center text-muted mt-3">No se encontraron roles.</p>}
        </Card.Body>
        {roles.length > 0 && (
          <Card.Footer className="bg-light text-muted text-sm p-2">
            Total de roles: {roles.length}
          </Card.Footer>
        )}
      </Card>

      <ModalCrearRol
        show={showCrearRolModal}
        handleClose={() => setShowCrearRolModal(false)}
        onRolCreado={handleRolCreado}
      />
      <ModalEditarPermisosRol
        show={showEditarPermisosModal}
        handleClose={() => {
          setShowEditarPermisosModal(false);
          setRolParaEditarPermisos(null);
        }}
        rol={rolParaEditarPermisos}
        onPermisosActualizados={handlePermisosDeRolActualizados}
      />
      <ModalGestionarRolesUsuario
        show={showGestionarRolesModal}
        handleClose={() => {
          setShowGestionarRolesModal(false);
          setUsuarioParaGestionarRoles(null);
        }}
        usuario={usuarioParaGestionarRoles}
        onRolesActualizados={handleRolesDeUsuarioActualizados}
      />
      {/* NUEVO: Renderizar Modal para Crear Usuario */}
      <ModalCrearUsuario
        show={showCrearUsuarioModal}
        handleClose={() => setShowCrearUsuarioModal(false)}
        onUsuarioCreado={handleUsuarioCreado}
      />
    </>
  );
};

export default GestionUsuariosPage;
