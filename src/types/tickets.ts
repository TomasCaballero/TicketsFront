// src/types/tickets.ts
import type { UsuarioSimpleDto } from './auth'; // Asumiendo que está en src/types/auth.ts
import type { ClienteSimpleDto } from './clientes'; // Asumiendo que está en src/types/clientes.ts
import type { CentroDeCostoSimpleDto } from './centrosDeCosto'; // Asumiendo que está en src/types/centrosDeCosto.ts

// Estos tipos deben coincidir con las enumeraciones del backend
// Si el backend devuelve los enums como strings, usa string aquí.
// Si los devuelve como números (valor del enum), usa number.
export type PrioridadTicketEnum = 0 | 1 | 2 | 3;
export const PrioridadTicketEnum = {
  BAJA: 0 as 0,
  MEDIA: 1 as 1,
  ALTA: 2 as 2,
  URGENTE: 3 as 3,
};

export type EstadoTicketEnum = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export const EstadoTicketEnum = {
  NUEVO: 0 as 0,
  ABIERTO: 1 as 1,
  ASIGNADO: 2 as 2,
  EN_PROGRESO: 3 as 3,
  PENDIENTE_CLIENTE: 4 as 4,
  EN_REVISION: 5 as 5,
  RESUELTO: 6 as 6,
  CERRADO: 7 as 7,
};

export interface NotaSimpleDto {
  notaID: string;
  contenido: string;
  fechaCreacion: string; // o Date
  usuarioCreador?: UsuarioSimpleDto;
  tiempoDeTrabajo?: number | null;
  tipoNota: string; // "Soporte" o "Desarrollo"
}

export interface AdjuntoSimpleDto {
  adjuntoID: string;
  nombreArchivo: string;
  tipoArchivo: string;
  tamanoArchivoKB: number;
  fechaCarga: string; // o Date
  urlUbicacion: string;
  usuarioCargador?: UsuarioSimpleDto;
}

export interface TicketDto {
  ticketID: string;
  numeroTicketFormateado: string;
  titulo: string;
  descripcion?: string | null;
  fechaCreacion: string; // o Date
  fechaUltimaModificacion: string; // o Date
  prioridad: PrioridadTicketEnum; // Usar el enum
  estado: EstadoTicketEnum;       // Usar el enum
  tipoTicket: string; // "Soporte" o "Desarrollo"

  cliente?: ClienteSimpleDto | null;
  centroDeCosto?: CentroDeCostoSimpleDto | null;
  usuarioCreador?: UsuarioSimpleDto | null;
  usuarioResponsable?: UsuarioSimpleDto | null;
  participantes: UsuarioSimpleDto[];

  // Campos específicos para TicketDesarrollo
  fechaInicioPlanificada?: string | null; // o Date
  fechaFinPlanificada?: string | null;    // o Date
  horasEstimadas?: number | null;
  horasAcumuladas: number;

  notas: NotaSimpleDto[];
  adjuntos: AdjuntoSimpleDto[];
}

// También necesitarás tipos para DTOs de creación/actualización si los defines aquí
// export interface CrearTicketSoporteDto { ... }
// export interface CrearTicketDesarrolloDto { ... }
// export interface ActualizarTicketDto { ... }
