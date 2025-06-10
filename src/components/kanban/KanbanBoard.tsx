import React, { useMemo } from 'react';
import { type TicketDto, EstadoTicketEnum } from '../../types/tickets';
import KanbanColumn from './KanbanColumn';

// --- 1. CONFIGURACIÓN DE COLUMNAS DEL KANBAN ---
// Aquí defines tus nuevas columnas y qué estados de ticket pertenecen a cada una.
// Es flexible: si en el futuro quieres 5 columnas o cambiar la agrupación, solo modificas esto.
const KANBAN_COLUMNS_CONFIG: { title: string, statuses: EstadoTicketEnum[] }[] = [
    { 
        title: 'Abierto', 
        statuses: [EstadoTicketEnum.NUEVO, EstadoTicketEnum.ABIERTO] 
    },
    { 
        title: 'En Proceso', 
        statuses: [EstadoTicketEnum.ASIGNADO, EstadoTicketEnum.EN_PROGRESO] 
    },
    { 
        title: 'En Revisión', 
        statuses: [EstadoTicketEnum.PENDIENTE_CLIENTE, EstadoTicketEnum.EN_REVISION] 
    },
    { 
        title: 'Cerrado', 
        statuses: [EstadoTicketEnum.RESUELTO, EstadoTicketEnum.CERRADO] 
    },
];

interface KanbanBoardProps {
  tickets: TicketDto[];
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tickets }) => {

  // --- 2. LÓGICA PARA AGRUPAR TICKETS SEGÚN LA NUEVA CONFIGURACIÓN ---
  const ticketsByColumn = useMemo(() => {
    // Inicializamos un objeto para nuestras columnas. Ej: { 'Abierto': [], 'En Proceso': [], ... }
    const grouped: { [key: string]: TicketDto[] } = {};
    KANBAN_COLUMNS_CONFIG.forEach(col => {
      grouped[col.title] = [];
    });

    // Iteramos sobre cada ticket
    tickets.forEach(ticket => {
      // Buscamos a qué columna de nuestra configuración pertenece el estado del ticket
      const columnConfig = KANBAN_COLUMNS_CONFIG.find(col => col.statuses.includes(ticket.estado));
      
      // Si encontramos una columna, añadimos el ticket a ella
      if (columnConfig) {
        grouped[columnConfig.title].push(ticket);
      }
    });

    return grouped;
  }, [tickets]);

  return (
    // --- 3. RENDERIZADO DEL TABLERO BASADO EN LA CONFIGURACIÓN ---
    <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: '1rem' }}>
        {KANBAN_COLUMNS_CONFIG.map(col => (
            <div key={col.title} style={{ minWidth: '300px', flex: '0 0 auto' }} className="me-3">
                <KanbanColumn
                    title={col.title}
                    tickets={ticketsByColumn[col.title] || []}
                />
            </div>
        ))}
    </div>
  );
};

export default KanbanBoard;