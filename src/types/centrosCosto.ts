import type { UsuarioSimpleDto } from './auth';
import { TipoCentroCosto , type TicketDto } from './tickets';

export interface CentroDeCostoDto {
  centroDeCostoID: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoCentroCosto;
  usuarioResponsable: UsuarioSimpleDto | null;
  participantes: UsuarioSimpleDto[];
  tickets: TicketDto[];
}

export interface CrearCentroDeCostoDto {
  nombre: string;
  descripcion?: string;
  tipo: TipoCentroCosto;
  usuarioResponsableId?: string | null;
  participantesIds?: string[];
}

export interface ActualizarCentroDeCostoDto {
  nombre?: string;
  descripcion?: string;
  tipo?: TipoCentroCosto;
}