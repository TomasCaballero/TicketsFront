import type { TipoClienteEnum } from "./tickets";

export interface CrearContactoParaClienteDto { nombre: string; apellido: string; email: string; telefonoDirecto?: string; cargo?: string; esPrincipal?: boolean; }

export interface CrearClienteConContactosDto { nombreCliente: string; tipoCliente: TipoClienteEnum; cuit_RUC?: string; emailPrincipal?: string; telefonoPrincipal?: string; direccionFiscal?: string; contactosNuevos?: CrearContactoParaClienteDto[]; }

export interface ContactoParaClienteDto {
  contactoID: string;
  nombre: string;
  apellido: string;
  email: string;
}
export interface ClienteCreadoDto {
  clienteID: string;
  nombreCliente: string;
  tipoCliente: 'Empresa' | 'PersonaIndividual' | number; // O como lo tengas definido
  contactos?: ContactoParaClienteDto[]; // Importante si es empresa
}

export interface ClienteParaSelectorDto {
  clienteID: string;
  nombreCliente: string;
  tipoCliente: 'Empresa' | 'PersonaIndividual' | number; // O como lo tengas definido
  contactos?: ContactoParaClienteDto[]; // Importante si es empresa
}
