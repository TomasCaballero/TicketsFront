// src/pages/TicketsListPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient'; // Ajusta la ruta si es necesario
import type { TicketDto } from '../types/tickets'; // Crearemos este tipo luego
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner'; // Para el indicador de carga
import { BsEye as Eye, BsPencilSquare as PencilSquare, BsTrash3 as Trash3 } from 'react-icons/bs'; // Iconos

// Definir el tipo para TicketDto (simplificado, ajusta según tu backend)
// Idealmente, esto estaría en src/types/tickets.ts
// export interface TicketDto {
//   ticketID: string;
//   numeroTicketFormateado: string;
//   titulo: string;
//   cliente?: { nombre: string; apellido?: string };
//   prioridad: number; // O string si tu enum se mapea a string
//   estado: number;    // O string
//   fechaCreacion: string; // O Date
//   usuarioResponsable?: { nombreCompleto: string };
//   tipoTicket: string;
// }

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

  const getPrioridadText = (prioridadValue: number): string => {
    // Asume que tu enum PrioridadTicket en el backend se mapea a estos valores:
    // BAJA = 0, MEDIA = 1, ALTA = 2, URGENTE = 3
    switch (prioridadValue) {
      case 0: return 'Baja';
      case 1: return 'Media';
      case 2: return 'Alta';
      case 3: return 'Urgente';
      default: return 'Desconocida';
    }
  };

  const getEstadoText = (estadoValue: number): string => {
    // Asume que tu enum EstadoTicket en el backend se mapea a estos valores:
    // NUEVO = 0, ABIERTO = 1, ASIGNADO = 2, EN_PROGRESO = 3, PENDIENTE_CLIENTE = 4, 
    // EN_REVISION = 5, RESUELTO = 6, CERRADO = 7
    const estados = [
      'Nuevo', 'Abierto', 'Asignado', 'En Progreso', 
      'Pendiente Cliente', 'En Revisión', 'Resuelto', 'Cerrado'
    ];
    return estados[estadoValue] || 'Desconocido';
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
        return new Date(dateString).toLocaleDateString('es-AR', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
    } catch (e) {
        return dateString; // Devuelve el string original si hay error
    }
  };


  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Cargando tickets...</span>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">Error: {error}</Alert>;
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h1 className="h3 mb-0">Lista de Tickets</h1>
        <Button variant="primary" onClick={() => navigate('/tickets/nuevo')}> {/* Ajusta la ruta para crear ticket */}
          <i className="bi bi-plus-circle me-2"></i> {/* Si usas iconos de Bootstrap */}
          Nuevo Ticket
        </Button>
      </div>
      <div className="card-body">
        {tickets.length === 0 ? (
          <p>No hay tickets para mostrar.</p>
        ) : (
          <Table striped bordered hover responsive="sm" className="align-middle">
            <thead>
              <tr>
                <th># Ticket</th>
                <th>Título</th>
                <th>Cliente</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Tipo</th>
                <th>Creado</th>
                <th>Responsable</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.ticketID}>
                  <td>{ticket.numeroTicketFormateado}</td>
                  <td>{ticket.titulo}</td>
                  <td>{ticket.cliente ? `${ticket.cliente.nombre} ${ticket.cliente.apellido || ''}`.trim() : 'N/A'}</td>
                  <td>{getPrioridadText(ticket.prioridad)}</td>
                  <td>{getEstadoText(ticket.estado)}</td>
                  <td>{ticket.tipoTicket}</td>
                  <td>{formatDate(ticket.fechaCreacion)}</td>
                  <td>{ticket.usuarioResponsable ? ticket.usuarioResponsable.nombreCompleto : 'No asignado'}</td>
                  <td>
                    <Button variant="outline-info" size="sm" className="me-1" onClick={() => navigate(`/tickets/${ticket.ticketID}`)} title="Ver Detalles">
                        <Eye size={16} />
                    </Button>
                    <Button variant="outline-warning" size="sm" className="me-1" onClick={() => navigate(`/tickets/editar/${ticket.ticketID}`)} title="Editar">
                        <PencilSquare size={16} />
                    </Button>
                    {/* El botón de eliminar requeriría lógica adicional y confirmación */}
                    <Button variant="outline-danger" size="sm" title="Eliminar" onClick={() => alert(`Eliminar ticket ${ticket.ticketID} (funcionalidad no implementada)`)}>
                        <Trash3 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {/* Aquí podrías añadir paginación si es necesario */}
      </div>
    </div>
  );
};

export default TicketsListPage;
