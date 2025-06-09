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

export type TipoClienteEnum = 1 | 2;
export const TipoClienteEnum = {
  Empresa: 1 as 1,
  PersonaIndividual: 2 as 2,
};

export interface NotaSimpleDto {
  notaID: string;
  contenido: string;
  fechaCreacion: string; 
  usuarioCreador?: UsuarioSimpleDto | null;
  tiempoDeTrabajo?: number | null;
  tipoNota: string;
  adjuntos: AdjuntoSimpleDto[];
}

export interface AdjuntoSimpleDto {
  adjuntoID: string;
  nombreArchivo: string;
  tipoArchivo: string;
  tamanoArchivoKB: number;
  fechaCarga: string; 
  urlUbicacion: string;
  usuarioCargador?: UsuarioSimpleDto | null;
  descripcion?: string | null;
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
  fechaInicioPlanificada?: string | null; 
  fechaFinPlanificada?: string | null;   
  horasEstimadas?: number | null;
}

// --- DTO para Actualización de Tickets ---
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

// --- DTOs para Creación de Notas ---
// (Estos son los que faltaban en el código que me pasaste)
export interface CrearNotaBaseDto {
    contenido: string;
}

export interface CrearNotaSoporteDto extends CrearNotaBaseDto {
    tiempoDeTrabajo?: number | null; // Coincide con el DTO del backend
}

export interface CrearNotaDesarrolloDto extends CrearNotaBaseDto {
    tiempoDeTrabajo: number; // Coincide con el DTO del backend (obligatorio y positivo)
}

// --- DTOs para Actualización de Notas ---
// (Los añadimos aquí para tener todos los tipos de notas juntos)
export interface ActualizarNotaBaseDto {
    contenido?: string | null;
}
export interface ActualizarNotaSoporteDto extends ActualizarNotaBaseDto {
    tiempoDeTrabajo?: number | null;
}
export interface ActualizarNotaDesarrolloDto extends ActualizarNotaBaseDto {
    tiempoDeTrabajo?: number | null; 
}


export interface ContactoParaClienteDto {
  contactoID: string;
  nombre: string;
  apellido: string;
  email: string;
}
export interface ClienteParaSelectorDto {
  clienteID: string;
  nombreCliente: string;
  tipoCliente: 'Empresa' | 'PersonaIndividual' | number;
  contactos?: ContactoParaClienteDto[];
}

