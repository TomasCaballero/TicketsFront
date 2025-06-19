// src/pages/DashboardPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import { Card, Spinner, Alert, ListGroup, Badge, Button, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import type { UsuarioAdminDto } from '../types/admin';
import type { TicketDto } from '../types/tickets';
import { EstadoTicketEnum } from '../types/tickets';
import { PersonCheck, TicketDetailed, JournalCheck, CalendarWeek } from 'react-bootstrap-icons';
// Importamos el tipo para la respuesta paginada
import type { PagedResultDto } from '../types/common';


const DashboardPage: React.FC = () => {
  const { usuarioActual } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioAdminDto[]>([]);
  // --- CAMBIO 1: El estado ahora guardará el objeto paginado o null ---
  const [pagedTickets, setPagedTickets] = useState<PagedResultDto<TicketDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // --- CAMBIO 2: Especificamos que esperamos un PagedResultDto<TicketDto> ---
        const [usuariosRes, ticketsRes] = await Promise.all([
          usuarioActual?.roles.includes('Administrador') ? apiClient.get<UsuarioAdminDto[]>('/api/admin/usuarios') : Promise.resolve({ data: [] }),
          apiClient.get<PagedResultDto<TicketDto>>('/api/tickets', { params: { pageSize: 100 } }) // Pedimos hasta 100 tickets para el dashboard
        ]);
        setUsuarios(usuariosRes.data);
        setPagedTickets(ticketsRes.data); // Guardamos el objeto de paginación completo
      } catch (err: any) {
        setError("Error al cargar los datos para el dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [usuarioActual]);

  // --- CAMBIO 3: Usamos pagedTickets.items en lugar de 'tickets' y manejamos el caso inicial (null) ---
  const allTickets = useMemo(() => pagedTickets?.items || [], [pagedTickets]);

  const usuariosPendientes = useMemo(() => 
    usuarios.filter(u => !u.estaActivo), 
  [usuarios]);

  const ticketsSinAsignar = useMemo(() => 
    allTickets.filter(t => !t.usuarioResponsable && t.estado !== EstadoTicketEnum.RESUELTO && t.estado !== EstadoTicketEnum.CERRADO),
  [allTickets]);

  const misTicketsAsignados = useMemo(() =>
    allTickets.filter(t => t.usuarioResponsable?.id === usuarioActual?.id && t.estado !== EstadoTicketEnum.RESUELTO && t.estado !== EstadoTicketEnum.CERRADO)
      .sort((a, b) => a.prioridad > b.prioridad ? -1 : 1), 
  [allTickets, usuarioActual]);

  const proximasEntregas = useMemo(() =>
    allTickets.filter(t => t.tipoTicket === 'Desarrollo' && t.fechaFinPlanificada && (t.estado !== EstadoTicketEnum.RESUELTO && t.estado !== EstadoTicketEnum.CERRADO))
      .sort((a, b) => new Date(a.fechaFinPlanificada!).getTime() - new Date(b.fechaFinPlanificada!).getTime()), 
  [allTickets]);

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h1 className="h3 mb-4">Dashboard</h1>
      <p className="lead">Bienvenido de nuevo, {usuarioActual?.nombre || usuarioActual?.username}.</p>
      <hr />
      
      <Row>
        {usuarioActual?.roles.includes('Administrador') && (
          <>
            <Col md={6} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Header className="d-flex align-items-center">
                  <PersonCheck className="me-2" size={24} />
                  <h5 className="mb-0">Usuarios Pendientes de Activación</h5>
                  <Badge pill bg="warning" className="ms-auto">{usuariosPendientes.length}</Badge>
                </Card.Header>
                <ListGroup variant="flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {usuariosPendientes.length > 0 ? (
                    usuariosPendientes.map(u => (
                      <ListGroup.Item key={u.id} className="d-flex justify-content-between align-items-center">
                        {u.nombre} {u.apellido} ({u.email})
                        <Button as={Link as any} to="/admin/usuarios" variant="outline-success" size="sm">Gestionar</Button>
                      </ListGroup.Item>
                    ))
                  ) : (
                    <ListGroup.Item className="text-muted">No hay usuarios pendientes.</ListGroup.Item>
                  )}
                </ListGroup>
              </Card>
            </Col>

            <Col md={6} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Header className="d-flex align-items-center">
                  <TicketDetailed className="me-2" size={24}/>
                  <h5 className="mb-0">Tickets sin Asignar</h5>
                  <Badge pill bg="danger" className="ms-auto">{ticketsSinAsignar.length}</Badge>
                </Card.Header>
                <ListGroup variant="flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {ticketsSinAsignar.length > 0 ? (
                    ticketsSinAsignar.map(t => (
                      <ListGroup.Item key={t.ticketID} action as={Link} to={`/tickets/${t.ticketID}`}>
                        <strong>{t.numeroTicketFormateado}:</strong> {t.titulo}
                      </ListGroup.Item>
                    ))
                  ) : (
                    <ListGroup.Item className="text-muted">No hay tickets sin asignar.</ListGroup.Item>
                  )}
                </ListGroup>
              </Card>
            </Col>
          </>
        )}

        {(usuarioActual?.roles.includes('Soporte') || usuarioActual?.roles.includes('Desarrollador')) && (
          <Col md={6} className="mb-4">
            <Card className="shadow-sm h-100">
              <Card.Header className="d-flex align-items-center">
                <JournalCheck className="me-2" size={24} />
                <h5 className="mb-0">Mis Tareas Asignadas</h5>
                <Badge pill bg="primary" className="ms-auto">{misTicketsAsignados.length}</Badge>
              </Card.Header>
              <ListGroup variant="flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {misTicketsAsignados.length > 0 ? (
                  misTicketsAsignados.map(t => (
                    <ListGroup.Item key={t.ticketID} action as={Link} to={`/tickets/${t.ticketID}`}>
                      <strong>{t.numeroTicketFormateado}:</strong> {t.titulo}
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item className="text-muted">No tienes tareas asignadas.</ListGroup.Item>
                )}
              </ListGroup>
            </Card>
          </Col>
        )}

        {usuarioActual?.roles.includes('Desarrollador') && (
          <Col md={6} className="mb-4">
            <Card className="shadow-sm h-100">
              <Card.Header className="d-flex align-items-center">
                <CalendarWeek className="me-2" size={24} />
                <h5 className="mb-0">Próximas Entregas de Desarrollo</h5>
                <Badge pill bg="info" className="ms-auto">{proximasEntregas.length}</Badge>
              </Card.Header>
              <ListGroup variant="flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {proximasEntregas.length > 0 ? (
                  proximasEntregas.map(t => (
                    <ListGroup.Item key={t.ticketID} action as={Link} to={`/tickets/${t.ticketID}`}>
                      <div className="d-flex justify-content-between">
                        <span><strong>{t.numeroTicketFormateado}:</strong> {t.titulo}</span>
                        <span className="text-muted">{new Date(t.fechaFinPlanificada!).toLocaleDateString('es-AR')}</span>
                      </div>
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item className="text-muted">No hay entregas planificadas.</ListGroup.Item>
                )}
              </ListGroup>
            </Card>
          </Col>
        )}
        
      </Row>
    </div>
  );
};

export default DashboardPage;