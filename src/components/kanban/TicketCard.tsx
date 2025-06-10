import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge } from 'react-bootstrap';
import { type TicketDto, PrioridadTicketEnum } from '../../types/tickets';

const prioridadMap: Record<number, { variant: string }> = {
  [PrioridadTicketEnum.BAJA]: { variant: 'secondary' },
  [PrioridadTicketEnum.MEDIA]: { variant: 'info' },
  [PrioridadTicketEnum.ALTA]: { variant: 'warning' },
  [PrioridadTicketEnum.URGENTE]: { variant: 'danger' },
};

interface TicketCardProps {
  ticket: TicketDto;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket }) => {
  const prioridadInfo = prioridadMap[ticket.prioridad];
  return (
    <Card className="mb-2 shadow-sm">
      <Card.Body className="p-2">
        <Link to={`/tickets/${ticket.ticketID}`} className="text-decoration-none text-dark">
          <div className="d-flex justify-content-between align-items-start">
            <p className="fw-bold mb-1" style={{ fontSize: '0.9rem' }}>{ticket.titulo}</p>
            {prioridadInfo && <Badge pill bg={prioridadInfo.variant}> </Badge>}
          </div>
          <div className="d-flex justify-content-between align-items-center mt-1">
            <small className="text-muted">{ticket.numeroTicketFormateado}</small>
            <small className="text-muted">{ticket.usuarioResponsable?.nombreCompleto || 'N/A'}</small>
          </div>
        </Link>
      </Card.Body>
    </Card>
  );
};

export default TicketCard;