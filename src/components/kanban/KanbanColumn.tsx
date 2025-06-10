import React from 'react';
import { Card } from 'react-bootstrap';
import { type TicketDto } from '../../types/tickets';
import TicketCard from './TicketCard';

interface KanbanColumnProps {
  title: string;
  tickets: TicketDto[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, tickets }) => {
  return (
    <Card className="h-100 bg-light">
      <Card.Header className="text-center fw-bold">{title} ({tickets.length})</Card.Header>
      <Card.Body className="p-2" style={{ overflowY: 'auto' }}>
        {tickets.map(ticket => (
          <TicketCard key={ticket.ticketID} ticket={ticket} />
        ))}
        {tickets.length === 0 && <p className="text-center text-muted small mt-2">No hay tickets en este estado.</p>}
      </Card.Body>
    </Card>
  );
};

export default KanbanColumn;