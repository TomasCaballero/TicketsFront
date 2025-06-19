// src/types/requests.ts
import type { PrioridadTicketEnum, EstadoTicketEnum, TipoClienteEnum, TipoCentroCosto } from './tickets';

export interface PagedRequestDto {
    pageNumber?: number;
    pageSize?: number;
}

export interface ObtenerTicketsRequestDto extends PagedRequestDto {
    filtroTitulo?: string;
    filtroCliente?: string;
    filtroResponsable?: string;
    filtroPrioridad?: PrioridadTicketEnum;
    filtroEstado?: EstadoTicketEnum;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}

export interface ObtenerClientesRequestDto extends PagedRequestDto {
    filtroNombre?: string;
    filtroCuitRuc?: string;
    filtroTipoCliente?: TipoClienteEnum;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}

export interface ObtenerCentrosDeCostoRequestDto extends PagedRequestDto {
    filtroNombre?: string;
    filtroTipo?: TipoCentroCosto;
    filtroResponsable?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}