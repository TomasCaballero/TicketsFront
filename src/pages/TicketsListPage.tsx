// src/pages/TicketsListPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
// CORRECCIÓN: Importar enums como valores, no solo como tipos
import { type TicketDto, PrioridadTicketEnum, EstadoTicketEnum } from '../types/tickets'; 
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Badge from 'react-bootstrap/Badge'; 
import { Eye, PencilSquare, Trash3, PlusCircle } from 'react-bootstrap-icons';

const TicketsListPage: React.FC = () => {
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<TicketDto[]>('/api/tickets');
        setTickets(response.data);
      } catch (err: any) {
        if (err.response) {
          setError(err.response.data.message || 'Error al cargar los tickets.');
        } else {
          setError('Error de red o el servidor no responde.');
        }
        console.error('Error fetching tickets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const prioridadMap: Record<PrioridadTicketEnum, { text: string; variant: string }> = useMemo(() => ({
    [PrioridadTicketEnum.BAJA]: { text: 'Baja', variant: 'secondary' },
    [PrioridadTicketEnum.MEDIA]: { text: 'Media', variant: 'info' },
    [PrioridadTicketEnum.ALTA]: { text: 'Alta', variant: 'warning' },
    [PrioridadTicketEnum.URGENTE]: { text: 'Urgente', variant: 'danger' },
  }), []);

  const estadoMap: Record<EstadoTicketEnum, { text: string; variant: string }> = useMemo(() => ({
    [EstadoTicketEnum.NUEVO]: { text: 'Nuevo', variant: 'primary' },
    [EstadoTicketEnum.ABIERTO]: { text: 'Abierto', variant: 'success' },
    [EstadoTicketEnum.ASIGNADO]: { text: 'Asignado', variant: 'info' },
    [EstadoTicketEnum.EN_PROGRESO]: { text: 'En Progreso', variant: 'warning' },
    [EstadoTicketEnum.PENDIENTE_CLIENTE]: { text: 'Pendiente Cliente', variant: 'light' },
    [EstadoTicketEnum.EN_REVISION]: { text: 'En Revisión', variant: 'secondary' },
    [EstadoTicketEnum.RESUELTO]: { text: 'Resuelto', variant: 'dark' }, 
    [EstadoTicketEnum.CERRADO]: { text: 'Cerrado', variant: 'secondary' },
  }), []);
  
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('es-AR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
        });
    } catch (e) {
        return dateString; 
    }
  };

  const handleViewDetails = (ticketId: string) => {
    navigate(`/tickets/${ticketId}`); 
  };

  const handleEditTicket = (ticketId: string) => {
    navigate(`/tickets/editar/${ticketId}`); 
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el ticket ${ticketId}?`)) {
      try {
        await apiClient.delete(`/api/tickets/${ticketId}`);
        setTickets(tickets.filter(ticket => ticket.ticketID !== ticketId));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al eliminar el ticket.');
        console.error('Error deleting ticket:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 200px)' }}> 
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }}/>
        <span className="ms-3 fs-5">Cargando tickets...</span>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger" className="m-3">Error: {error}</Alert>;
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-light p-3 d-flex justify-content-between align-items-center">
        <h1 className="h4 mb-0 text-dark">Lista de Tickets</h1>
        <Button variant="primary" onClick={() => navigate('/tickets/nuevo')}>
          <PlusCircle size={20} className="me-2" />
          Nuevo Ticket
        </Button>
      </div>
      <div className="card-body p-0"> 
        {tickets.length === 0 ? (
          <div className="p-3 text-center text-muted">No hay tickets para mostrar.</div>
        ) : (
          <Table striped bordered hover responsive="lg" className="mb-0 align-middle text-sm"> 
            <thead className="table-light">
              <tr>
                <th># Ticket</th>
                <th>Título</th>
                <th>Cliente</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Tipo</th>
                <th>Creado Por</th>
                <th>Responsable</th>
                <th>Fecha Creación</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.ticketID}>
                  <td>
                    <Button variant="link" size="sm" onClick={() => handleViewDetails(ticket.ticketID)} className="p-0 fw-medium">
                      {ticket.numeroTicketFormateado}
                    </Button>
                  </td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ticket.titulo}>
                    {ticket.titulo}
                  </td>
                  <td>{ticket.cliente ? `${ticket.cliente.nombre} ${ticket.cliente.apellido || ''}`.trim() : 'N/A'}</td>
                  <td>
                    <Badge bg={prioridadMap[ticket.prioridad]?.variant || 'secondary'}>
                      {prioridadMap[ticket.prioridad]?.text || 'Desconocida'}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={estadoMap[ticket.estado]?.variant || 'secondary'} text={ (estadoMap[ticket.estado]?.variant === 'light' || estadoMap[ticket.estado]?.variant === 'warning') ? 'dark' : undefined}>
                      {estadoMap[ticket.estado]?.text || 'Desconocido'}
                    </Badge>
                  </td>
                  <td>{ticket.tipoTicket}</td>
                  <td>{ticket.usuarioCreador ? ticket.usuarioCreador.nombreCompleto : 'N/A'}</td>
                  <td>{ticket.usuarioResponsable ? ticket.usuarioResponsable.nombreCompleto : 'No asignado'}</td>
                  <td>{formatDate(ticket.fechaCreacion)}</td>
                  <td className="text-center">
                    <Button variant="outline-info" size="sm" className="me-1 p-1" onClick={() => handleViewDetails(ticket.ticketID)} title="Ver Detalles">
                        <Eye size={18} />
                    </Button>
                    <Button variant="outline-warning" size="sm" className="me-1 p-1" onClick={() => handleEditTicket(ticket.ticketID)} title="Editar">
                        <PencilSquare size={18} />
                    </Button>
                    <Button variant="outline-danger" size="sm" className="p-1" title="Eliminar" onClick={() => handleDeleteTicket(ticket.ticketID)}>
                        <Trash3 size={18} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
      {tickets.length > 0 && (
        <div className="card-footer bg-light text-muted text-sm p-2">
          Total de tickets: {tickets.length}
        </div>
      )}
    </div>
  );
};

export default TicketsListPage;

