// src/pages/TicketDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { type TicketDto, type NotaSimpleDto, type AdjuntoSimpleDto, PrioridadTicketEnum, EstadoTicketEnum } from '../types/tickets';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import ListGroup from 'react-bootstrap/ListGroup';
import { ArrowLeft, Paperclip, ChatDots, PersonFill, CalendarEvent, ClockHistory, BarChartLine, PlusCircle, Download, Trash3, Eye as EyeIcon } from 'react-bootstrap-icons'; // Renombrado Eye a EyeIcon para evitar conflicto

import ModalCrearNota from '../components/ModalCrearNota'; 
import ModalSubirAdjunto from '../components/ModalSubirAdjunto'; 
import ModalPrevisualizarAdjunto from '../components/ModalPrevisualizarAdjunto'; // <-- NUEVA IMPORTACIÓN

const prioridadMap: Record<PrioridadTicketEnum, { text: string; variant: string }> = {
    [PrioridadTicketEnum.BAJA]: { text: 'Baja', variant: 'secondary' },
    [PrioridadTicketEnum.MEDIA]: { text: 'Media', variant: 'info' },
    [PrioridadTicketEnum.ALTA]: { text: 'Alta', variant: 'warning' },
    [PrioridadTicketEnum.URGENTE]: { text: 'Urgente', variant: 'danger' },
};

const estadoMap: Record<EstadoTicketEnum, { text: string; variant: string }> = {
    [EstadoTicketEnum.NUEVO]: { text: 'Nuevo', variant: 'primary' },
    [EstadoTicketEnum.ABIERTO]: { text: 'Abierto', variant: 'success' },
    [EstadoTicketEnum.ASIGNADO]: { text: 'Asignado', variant: 'info' },
    [EstadoTicketEnum.EN_PROGRESO]: { text: 'En Progreso', variant: 'warning' },
    [EstadoTicketEnum.PENDIENTE_CLIENTE]: { text: 'Pendiente Cliente', variant: 'light' },
    [EstadoTicketEnum.EN_REVISION]: { text: 'En Revisión', variant: 'secondary' },
    [EstadoTicketEnum.RESUELTO]: { text: 'Resuelto', variant: 'dark' },
    [EstadoTicketEnum.CERRADO]: { text: 'Cerrado', variant: 'secondary' },
};

const formatDate = (dateString?: string | null, includeTime = false): string => {
    if (!dateString) return 'N/A';
    try {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric', month: '2-digit', day: '2-digit'
        };
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        return new Date(dateString).toLocaleString('es-AR', options);
    } catch (e) {
        return dateString; 
    }
};

const TicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<TicketDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [showCrearNotaModal, setShowCrearNotaModal] = useState<boolean>(false);
  const [showSubirAdjuntoModal, setShowSubirAdjuntoModal] = useState<boolean>(false); 
  const [showPrevisualizarAdjuntoModal, setShowPrevisualizarAdjuntoModal] = useState<boolean>(false); // <-- NUEVO ESTADO
  const [adjuntoSeleccionado, setAdjuntoSeleccionado] = useState<AdjuntoSimpleDto | null>(null); // <-- NUEVO ESTADO

  const fetchTicketDetails = async (showLoader = true) => { 
    if (!ticketId) {
      setError("ID de Ticket no proporcionado.");
      setLoading(false);
      return;
    }
    if (showLoader) setLoading(true); 
    setError(null);
    try {
      const response = await apiClient.get<TicketDto>(`/api/tickets/${ticketId}`);
      setTicket(response.data);
    } catch (err: any) {
      if (err.response) {
          if (err.response.status === 404) {
              setError(`Ticket con ID '${ticketId}' no encontrado.`);
          } else {
              setError(err.response.data.message || `Error al cargar el ticket ${ticketId}.`);
          }
      } else {
        setError('Error de red o el servidor no responde.');
      }
      console.error(`Error fetching ticket ${ticketId}:`, err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  const handleNuevaNotaAgregada = (nuevaNota: NotaSimpleDto) => {
    fetchTicketDetails(false); 
  };

  const handleNuevoAdjuntoAgregado = (nuevoAdjunto: AdjuntoSimpleDto) => {
    fetchTicketDetails(false); 
  };

  const handleAbrirModalPrevisualizacion = (adjunto: AdjuntoSimpleDto) => {
    setAdjuntoSeleccionado(adjunto);
    setShowPrevisualizarAdjuntoModal(true);
  };

  const handleCerrarModalPrevisualizacion = () => {
    setShowPrevisualizarAdjuntoModal(false);
    setAdjuntoSeleccionado(null);
  };

  const handleEliminarAdjunto = async (adjuntoIdAEliminar: string) => {
    if (!ticketId) return;
    if (window.confirm("¿Estás seguro de que deseas eliminar este adjunto?")) {
        try {
            await apiClient.delete(`/api/adjuntos/${adjuntoIdAEliminar}`);
            setTicket(prevTicket => {
                if (!prevTicket) return null;
                return {
                    ...prevTicket,
                    adjuntos: prevTicket.adjuntos.filter(adj => adj.adjuntoID !== adjuntoIdAEliminar),
                    fechaUltimaModificacion: new Date().toISOString(),
                };
            });
        } catch (err: any) {
            console.error("Error al eliminar adjunto:", err);
            setError(err.response?.data?.message || "Error al eliminar el adjunto.");
        }
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
        <p className="ms-3 fs-5">Cargando detalles del ticket...</p>
      </Container>
    );
  }

  if (error) {
    return (
        <Container className="mt-4">
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
                <Alert.Heading>Error</Alert.Heading>
                <p>{error}</p>
                <Button variant="outline-danger" onClick={() => navigate('/tickets')}>Volver a la lista</Button>
            </Alert>
        </Container>
    );
  }

  if (!ticket) {
    return ( 
        <Container className="mt-4">
            <Alert variant="warning">Ticket no encontrado.</Alert>
            <Button variant="outline-secondary" onClick={() => navigate('/tickets')}>Volver a la lista</Button>
        </Container>
    );
  }
  
  const prioridadInfo = prioridadMap[ticket.prioridad] || { text: 'Desconocida', variant: 'secondary' };
  const estadoInfo = estadoMap[ticket.estado] || { text: 'Desconocido', variant: 'secondary' };
  const tipoTicketParaModal = ticket.tipoTicket === 'Soporte' ? 'Soporte' : 'Desarrollo';

  return (
    <Container fluid className="py-3">
      <Button variant="outline-secondary" size="sm" onClick={() => navigate('/tickets')} className="mb-3">
        <ArrowLeft size={18} className="me-1" /> Volver a la lista de Tickets
      </Button>

      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-light p-3 d-flex justify-content-between align-items-center">
            <h1 className="h4 mb-0 text-dark">
                Ticket: {ticket.numeroTicketFormateado} - <span className="fw-normal">{ticket.titulo}</span>
            </h1>
            <div>
                <Button variant="outline-primary" size="sm" className="me-2" onClick={() => navigate(`/tickets/editar/${ticket.ticketID}`)}>
                    Editar Ticket
                </Button>
            </div>
        </Card.Header>
        <Card.Body className="p-4">
          <Row>
            <Col md={8}>
              <h5 className="text-muted mb-3">Información del Ticket</h5>
              <p><strong>Descripción del Ticket:</strong> {ticket.descripcion || 'N/A'}</p>
              <Row>
                <Col sm={6} md={4} className="mb-3">
                  <strong>Cliente:</strong>
                  <p>{ticket.cliente ? `${ticket.cliente.nombre} ${ticket.cliente.apellido || ''}`.trim() : 'N/A'}</p>
                </Col>
                <Col sm={6} md={4} className="mb-3">
                  <strong>Creado por:</strong>
                  <p>{ticket.usuarioCreador?.nombreCompleto || 'N/A'}</p>
                </Col>
                <Col sm={6} md={4} className="mb-3">
                  <strong>Responsable:</strong>
                  <p>{ticket.usuarioResponsable?.nombreCompleto || 'No asignado'}</p>
                </Col>
                <Col sm={6} md={4} className="mb-3">
                  <strong>Centro de Costo:</strong>
                  <p>{ticket.centroDeCosto?.nombre || 'N/A'}</p>
                </Col>
                 <Col sm={6} md={4} className="mb-3">
                  <strong>Tipo de Ticket:</strong>
                  <p>{ticket.tipoTicket}</p>
                </Col>
              </Row>
              {ticket.tipoTicket === 'Desarrollo' && (
                <>
                  <hr/>
                  <h6 className="text-muted mt-3 mb-2">Detalles de Desarrollo</h6>
                  <Row>
                    <Col sm={6} md={4} className="mb-2"><strong>Inicio Planificado:</strong> {formatDate(ticket.fechaInicioPlanificada)}</Col>
                    <Col sm={6} md={4} className="mb-2"><strong>Fin Planificado:</strong> {formatDate(ticket.fechaFinPlanificada)}</Col>
                    <Col sm={6} md={4} className="mb-2"><strong>Horas Estimadas:</strong> {ticket.horasEstimadas?.toString() || 'N/A'}</Col>
                  </Row>
                </>
              )}
            </Col>
            <Col md={4} className="border-start-md ps-md-4 mt-4 mt-md-0">
                <h5 className="text-muted mb-3">Estado y Progreso</h5>
                <div className="mb-2">
                    <strong>Prioridad:</strong> <Badge bg={prioridadInfo.variant}>{prioridadInfo.text}</Badge>
                </div>
                <div className="mb-3">
                    <strong>Estado:</strong> <Badge bg={estadoInfo.variant} text={ (estadoInfo.variant === 'light' || estadoInfo.variant === 'warning') ? 'dark' : undefined}>{estadoInfo.text}</Badge>
                </div>
                <div className="mb-2"><CalendarEvent size={16} className="me-1 text-muted"/> <strong>Creado:</strong> {formatDate(ticket.fechaCreacion, true)}</div>
                <div className="mb-3"><ClockHistory size={16} className="me-1 text-muted"/> <strong>Últ. Modif.:</strong> {formatDate(ticket.fechaUltimaModificacion, true)}</div>
                <div><BarChartLine size={16} className="me-1 text-muted"/> <strong>Horas Acumuladas:</strong> {ticket.horasAcumuladas} hs</div>
            </Col>
          </Row>
          
          {ticket.participantes && ticket.participantes.length > 0 && (
            <>
              <hr className="my-4" />
              <h5 className="text-muted mb-3"><PersonFill size={20} className="me-1"/>Participantes ({ticket.participantes.length})</h5>
              <ListGroup horizontal className="flex-wrap">
                {ticket.participantes.map(p => (
                  <ListGroup.Item key={p.id} className="mb-1 me-1 border-0 bg-light rounded px-2 py-1 text-sm">
                    {p.nombreCompleto || p.username}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-light p-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 text-dark"><ChatDots size={20} className="me-2"/>Notas ({ticket.notas.length})</h5>
            <Button variant="outline-primary" size="sm" onClick={() => setShowCrearNotaModal(true)}>
                <PlusCircle size={18} className="me-1"/> Añadir Nueva Nota
            </Button>
        </Card.Header>
        {ticket.notas.length > 0 ? (
            <ListGroup variant="flush">
            {ticket.notas.map(nota => (
                <ListGroup.Item key={nota.notaID} className="p-3">
                <div className="d-flex w-100 justify-content-between">
                    <small className="text-muted">
                    <strong>{nota.usuarioCreador?.nombreCompleto || 'Usuario desconocido'}</strong> el {formatDate(nota.fechaCreacion, true)}
                    </small>
                    <Badge bg={nota.tipoNota === 'Desarrollo' ? 'info' : 'secondary'} pill>
                        {nota.tipoNota}
                        {nota.tiempoDeTrabajo != null && ` (${nota.tiempoDeTrabajo} hs)`}
                    </Badge>
                </div>
                <p className="mb-1 mt-2">{nota.contenido}</p>
                </ListGroup.Item>
            ))}
            </ListGroup>
        ) : (
            <Card.Body><p className="text-muted mb-0">No hay notas para este ticket.</p></Card.Body>
        )}
      </Card>

      <Card className="shadow-sm">
        <Card.Header className="bg-light p-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 text-dark"><Paperclip size={20} className="me-2"/>Adjuntos ({ticket.adjuntos.length})</h5>
            <Button variant="outline-primary" size="sm" onClick={() => setShowSubirAdjuntoModal(true)}>
                <PlusCircle size={18} className="me-1"/> Subir Nuevo Adjunto
            </Button>
        </Card.Header>
        {ticket.adjuntos.length > 0 ? (
            <ListGroup variant="flush">
            {ticket.adjuntos.map(adjunto => (
                <ListGroup.Item key={adjunto.adjuntoID} className="p-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            {/* CAMBIO: Usar un Button o span con onClick para abrir el modal de previsualización */}
                            <Button 
                                variant="link" 
                                className="p-0 fw-medium me-2" 
                                onClick={() => handleAbrirModalPrevisualizacion(adjunto)}
                                title={`Ver ${adjunto.nombreArchivo}`}
                            >
                                <EyeIcon size={16} className="me-1"/> {adjunto.nombreArchivo}
                            </Button>
                            <span className="text-muted text-sm">({adjunto.tamanoArchivoKB.toFixed(2)} KB)</span>
                        </div>
                        <Button variant="outline-danger" size="sm" className="p-1" title="Eliminar Adjunto" onClick={() => handleEliminarAdjunto(adjunto.adjuntoID)}>
                            <Trash3 size={16}/>
                        </Button>
                    </div>
                    {adjunto.descripcion && ( 
                        <p className="text-muted text-sm mt-1 mb-0 ms-3 ps-1 border-start border-2">
                            {adjunto.descripcion}
                        </p>
                    )}
                    <small className="text-muted d-block mt-1">
                        Subido por: {adjunto.usuarioCargador?.nombreCompleto || 'N/A'} el {formatDate(adjunto.fechaCarga, true)}
                    </small>
                </ListGroup.Item>
            ))}
            </ListGroup>
        ) : (
            <Card.Body><p className="text-muted mb-0">No hay adjuntos para este ticket.</p></Card.Body>
        )}
      </Card>

      {/* Renderizar Modales */}
      {ticketId && ticket && ( 
        <>
            <ModalCrearNota
                show={showCrearNotaModal}
                handleClose={() => setShowCrearNotaModal(false)}
                ticketId={ticketId}
                tipoTicketPadre={tipoTicketParaModal} 
                onNotaAgregada={handleNuevaNotaAgregada}
            />
            <ModalSubirAdjunto
                show={showSubirAdjuntoModal}
                handleClose={() => setShowSubirAdjuntoModal(false)}
                ticketId={ticketId} 
                onAdjuntoAgregado={handleNuevoAdjuntoAgregado}
            />
            {/* NUEVO MODAL DE PREVISUALIZACIÓN */}
            <ModalPrevisualizarAdjunto
                show={showPrevisualizarAdjuntoModal}
                handleClose={handleCerrarModalPrevisualizacion}
                adjunto={adjuntoSeleccionado}
            />
        </>
      )}
    </Container>
  );
};

export default TicketDetailPage;
