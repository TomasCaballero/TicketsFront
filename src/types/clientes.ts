// src/types/clientes.ts
import { TipoClienteEnum } from './tickets'; // O donde tengas la enum

// DTO para el formulario de crear un nuevo contacto para un cliente existente
export interface CrearContactoParaClienteDto {
  nombre: string;
  apellido: string;
  email: string;
  telefonoDirecto?: string;
  cargo?: string;
  esPrincipal?: boolean;
}

// DTO para enviar al backend para crear un cliente completo
export interface CrearClienteConContactosDto {
  nombreCliente: string;
  tipoCliente: TipoClienteEnum;
  cuit_RUC?: string;
  direccionFiscal?: string;
  telefonoPrincipal?: string;
  emailPrincipal?: string;
  contactosNuevos?: CrearContactoParaClienteDto[];
}

// Interfaz para el objeto Contacto que se RECIBE de la API (con su ID)
// ¡ESTA ES LA INTERFAZ QUE FALTA!
export interface ContactoParaClienteDto {
  contactoID: string;
  nombre: string;
  apellido: string;
  email: string;
  telefonoDirecto?: string;
  cargo?: string;
  esPrincipal?: boolean;
}

// DTO que se recibe del backend después de crear un cliente
export interface ClienteCreadoDto {
  clienteID: string;
  nombreCliente: string;
  tipoCliente: TipoClienteEnum;
  cuit_RUC?: string;
  contactos?: ContactoParaClienteDto[];
}

// DTO que se usa en el frontend para los selectores y el estado
export interface ClienteParaSelectorDto {
  clienteID: string;
  nombreCliente: string;
  tipoCliente: TipoClienteEnum;
  cuit_RUC?: string;
  contactos?: ContactoParaClienteDto[];
}
export const getApiBaseUrl = (): string => {
    return apiClient.defaults.baseURL || '';
};