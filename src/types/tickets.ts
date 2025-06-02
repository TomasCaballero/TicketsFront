// src/types/tickets.ts

// Asegúrate de que src/types/auth.ts exista y exporte UsuarioSimpleDto
import type { UsuarioSimpleDto } from './auth'; 

// Definición local de DTOs simples para evitar errores de módulo no encontrado.
export interface ClienteSimpleDto {
  clienteID: string;
  nombre: string;
  apellido?: string | null;
}

export interface CentroDeCostoSimpleDto {
  centroDeCostoID: string;
  nombre: string;
}

// Enums (sin cambios, deberían estar bien)
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
  fechaCreacion: string; 
  usuarioCreador?: UsuarioSimpleDto | null;
  tiempoDeTrabajo?: number | null;
  tipoNota: string; 
}

export interface AdjuntoSimpleDto {
  adjuntoID: string;
  nombreArchivo: string;
  tipoArchivo: string;
  tamanoArchivoKB: number;
  fechaCarga: string; 
  urlUbicacion: string;
  usuarioCargador?: UsuarioSimpleDto | null;
}

export interface TicketDto {
  ticketID: string;
  numeroTicketFormateado: string;
  titulo: string;
  descripcion?: string | null;
  fechaCreacion: string; 
  fechaUltimaModificacion: string; 
  prioridad: PrioridadTicketEnum; 
  estado: EstadoTicketEnum;       
  tipoTicket: string; 

  cliente?: ClienteSimpleDto | null;
  centroDeCosto?: CentroDeCostoSimpleDto | null;
  usuarioCreador?: UsuarioSimpleDto | null;
  usuarioResponsable?: UsuarioSimpleDto | null;
  participantes: UsuarioSimpleDto[];

  fechaInicioPlanificada?: string | null; 
  fechaFinPlanificada?: string | null;    
  horasEstimadas?: number | null;
  horasAcumuladas: number;

  notas: NotaSimpleDto[];
  adjuntos: AdjuntoSimpleDto[];
}

// --- DTOs para Creación de Tickets ---
// Estos deben coincidir con los DTOs del backend

export interface CrearTicketBaseDto {
  titulo: string;
  descripcion?: string | null;
  prioridad: PrioridadTicketEnum;
  clienteID: string;
  centroDeCostoID?: string | null;
  usuarioResponsableID?: string | null;
  participantesIds?: string[] | null;
}

export interface CrearTicketSoporteDto extends CrearTicketBaseDto {
  // No tiene propiedades adicionales específicas para la creación
}

export interface CrearTicketDesarrolloDto extends CrearTicketBaseDto {
  fechaInicioPlanificada?: string | null; // En el backend son DateTime?, aquí string para el input date
  fechaFinPlanificada?: string | null;   // En el backend son DateTime?, aquí string para el input date
  horasEstimadas?: number | null;
}

// --- DTO para Actualización de Tickets ---
// (Lo definimos aquí también para tener todos los tipos de ticket juntos)
export interface ActualizarTicketDto {
    titulo?: string | null;
    descripcion?: string | null;
    prioridad?: PrioridadTicketEnum | null;
    estado?: EstadoTicketEnum | null; 
    centroDeCostoID?: string | null; 
    usuarioResponsableID?: string | null; 
    fechaInicioPlanificada?: string | null; 
    fechaFinPlanificada?: string | null;    
    horasEstimadas?: number | null;
}