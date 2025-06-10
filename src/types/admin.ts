export interface UsuarioAdminDto {
  id: string;
  userName: string;
  nombre: string;
  apellido: string;
  email: string;
  emailConfirmed: boolean;
  estaActivo: boolean;
  roles: string[];
  lockoutEnd?: string | null; 
}

export interface UsuarioAdminDto {
  id: string;
  userName: string;
  nombre: string;
  apellido: string;
  email: string;
  emailConfirmed: boolean;
  estaActivo: boolean;
  roles: string[];
  lockoutEnd?: string | null;
}

export interface CrearUsuarioPorAdminDto {
  username: string;
  email: string;
  password?: string;
  nombre: string;
  apellido: string;
  estaActivo: boolean;
  roles?: string[];
}