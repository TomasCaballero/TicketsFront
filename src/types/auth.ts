export interface LoginDto {
  email: string;
  password?: string; 
}

export interface RegistroDto {
    username: string;
    email: string;
    password?: string;
    nombre: string;
    apellido: string;
}

export interface RespuestaAuthDto {
  token: string;
  expiracion: string; 
  usuarioId: string;
  username: string;
  email: string;
  roles: string[];
  estaActivo: boolean;
}

export interface UsuarioActual {
  id: string;
  username: string;
  email: string;
  roles: string[];
  nombre?: string; 
  apellido?: string; 
  estaActivo: boolean;
  permisos?: string[];
}

export interface UsuarioSimpleDto {
  id: string;
  username: string;
  nombreCompleto: string;
  email?: string | null;
  roles: string[];
}