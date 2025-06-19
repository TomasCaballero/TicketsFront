// src/types/clientes.ts
import { TipoClienteEnum, type TicketDto } from './tickets';

// DTO para el formulario de crear un nuevo contacto para un cliente existente
export interface CrearContactoParaClienteDto {
  nombre: string;
  apellido: string;
  email?: string; // CAMBIO: Ahora es opcional
  telefonoDirecto: string; // CAMBIO: Ahora es obligatorio
  cargo?: string;
  esPrincipal?: boolean;
}

// DTO para enviar al backend para crear un cliente completo
export interface CrearClienteConContactosDto {
  nombreCliente: string;
  tipoCliente: TipoClienteEnum;
  telefonoPrincipal: string; // CAMBIO: Ahora es obligatorio
  cuit_RUC?: string;
  direccionFiscal?: string;
  emailPrincipal?: string;
  contactosNuevos?: CrearContactoParaClienteDto[];
}


export interface ClienteDto {
  clienteID: string;
  nombreCliente: string;
  tipoCliente: TipoClienteEnum;
  cuiT_RUC?: string;
  direccionFiscal?: string;
  telefonoPrincipal?: string;
  emailPrincipal?: string;
  contactos?: ContactoParaClienteDto[];
  tickets?: TicketDto[];
}

export interface ContactoParaClienteDto {
  contactoID: string;
  nombre: string;
  apellido: string;
  email: string;
  telefonoDirecto?: string;
  cargo?: string;
  esPrincipal?: boolean;
}

export interface ClienteCreadoDto {
  clienteID: string;
  nombreCliente: string;
  tipoCliente: TipoClienteEnum;
  cuit_RUC?: string;
  contactos?: ContactoParaClienteDto[];
}

export interface ClienteParaSelectorDto {
  clienteID: string;
  nombreCliente: string;
  tipoCliente: TipoClienteEnum;
  cuit_RUC?: string;
  contactos?: ContactoParaClienteDto[];
}

export interface ActualizarClienteDto {
  nombreCliente: string;
  cuit_RUC?: string;
  direccionFiscal?: string;
  telefonoPrincipal?: string;
  emailPrincipal?: string;
}
export interface CrearClienteDto{
  nombreCliente: string;
  tipoCliente: TipoClienteEnum;
  telefonoPrincipal: string; // CAMBIO: Ahora es obligatorio
  cuit_RUC?: string;
  direccionFiscal?: string;
  emailPrincipal?: string;
  contactosNuevos?: CrearContactoParaClienteDto[];
}

export interface ActualizarContactoDto {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefonoDirecto?: string;
  cargo?: string;
  esPrincipal?: boolean;
}
export interface ContactoDto {
  contactoID: string;
  nombre: string;
  apellido: string;
  email: string;
  telefonoDirecto?: string;
  cargo?: string;
  esPrincipal?: boolean;
}