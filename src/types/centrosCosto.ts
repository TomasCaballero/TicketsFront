import type { UsuarioSimpleDto } from './auth';
import { TipoCentroCosto , type TicketDto } from './tickets';


// Para mostrar en la lista y rellenar el modal de edición
export interface CentroDeCostoDto {
  centroDeCostoID: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoCentroCosto;
  usuarioResponsable: UsuarioSimpleDto | null;
  participantes: UsuarioSimpleDto[];
  tickets: TicketDto[];
}

// Para el formulario de creación
export interface CrearCentroDeCostoDto {
  nombre: string;
  descripcion?: string;
  tipo: TipoCentroCosto;
  usuarioResponsableId?: string | null;
  participantesIds?: string[];
}

// Para el formulario de edición (solo los campos que se pueden cambiar en el PUT principal)
export interface ActualizarCentroDeCostoDto {
  nombre?: string;
  descripcion?: string;
  tipo?: TipoCentroCosto;
}