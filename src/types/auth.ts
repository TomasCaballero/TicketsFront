// Coincide con LoginDto del backend
export interface LoginDto {
  email: string;
  password?: string; // Hacemos password opcional si el backend lo permite para otros flujos
}

// Coincide con RegistroDto del backend
export interface RegistroDto {
    username: string;
    email: string;
    password?: string;
    nombre: string;
    apellido: string;
}

// Coincide con RespuestaAuthDto del backend
export interface RespuestaAuthDto {
  token: string;
  expiracion: string; // O Date si lo parseas
  usuarioId: string;
  username: string;
  email: string;
  roles: string[];
}

// Para guardar la información del usuario actual en el frontend
export interface UsuarioActual {
  id: string;
  username: string;
  email: string;
  roles: string[];
  nombre?: string; // Opcional, si quieres guardar Nombre y Apellido
  apellido?: string; // Opcional
}

export interface UsuarioSimpleDto { // <--- ASEGÚRATE QUE ESTO ESTÉ EXPORTADO
  id: string;
  username: string;
  nombreCompleto: string;
  email?: string | null;
}