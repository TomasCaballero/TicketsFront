import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import apiClient from '../services/apiClient'; 
import type { LoginDto, RespuestaAuthDto, UsuarioActual } from '../types/auth'; 
import { jwtDecode, type JwtPayload } from 'jwt-decode'; // Importar jwt-decode
import { Spinner } from 'react-bootstrap';

// Interfaz para el token decodificado, incluyendo nuestros claims personalizados
interface DecodedToken extends JwtPayload {
  nameid?: string; // ID del usuario (del claim ClaimTypes.NameIdentifier)
  sub?: string;    // Username (del claim JwtRegisteredClaimNames.Sub)
  email?: string;  // Email
  role?: string | string[]; // Roles (del claim ClaimTypes.Role)
  Permission?: string | string[]; // Nuestros permisos personalizados (del claim ServicioRoles.TIPO_CLAIM_PERMISO)
  nombre?: string; // Claim "nombre"
  apellido?: string; // Claim "apellido"
  estaActivo?: string; // Claim "estaActivo" (vendrá como string "true" o "false")
}

interface AuthContextType {
  isAuthenticated: boolean;
  usuarioActual: UsuarioActual | null;
  token: string | null;
  login: (loginDto: LoginDto) => Promise<RespuestaAuthDto>; 
  logout: () => void;
  isLoading: boolean;
  tienePermiso: (permisoRequerido: string) => boolean; // Nueva función para verificar permisos
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const parsePermissions = (permissionClaim: string | string[] | undefined): string[] => {
    if (!permissionClaim) return [];
    if (Array.isArray(permissionClaim)) return permissionClaim;
    return [permissionClaim];
};

const parseRoles = (roleClaim: string | string[] | undefined): string[] => {
    if (!roleClaim) return [];
    if (Array.isArray(roleClaim)) return roleClaim;
    return [roleClaim];
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [usuarioActual, setUsuarioActual] = useState<UsuarioActual | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); 

  const cargarUsuarioDesdeToken = (currentToken: string) => {
    try {
      const decoded = jwtDecode<DecodedToken>(currentToken);
      if (decoded && decoded.exp && decoded.exp * 1000 > Date.now()) { // Verificar expiración
        const isActive = decoded.estaActivo === 'true';
        const userData: UsuarioActual = {
          id: decoded.nameid || '',
          username: decoded.sub || '',
          email: decoded.email || '',
          roles: parseRoles(decoded.role),
          permisos: parsePermissions(decoded.Permission), // Extraer y parsear permisos
          estaActivo: isActive,
          nombre: decoded.nombre,
          apellido: decoded.apellido,
        };
        setUsuarioActual(userData);
        setIsAuthenticated(isActive); // Solo autenticado si está activo
        localStorage.setItem('usuarioActual', JSON.stringify(userData)); // Guardar usuario con permisos
        return isActive;
      } else {
        console.warn("Token expirado o inválido al cargar desde token.");
        return false; // Token expirado
      }
    } catch (e) {
      console.error("Error decodificando token al cargar:", e);
      return false; // Error decodificando
    }
  };


  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    // Ya no cargamos 'usuarioActual' directamente de localStorage para asegurar que los permisos
    // y el estado 'estaActivo' vengan del token o de una fuente fresca.
    // Si solo hay token, intentamos decodificarlo.
    if (storedToken) {
      setToken(storedToken);
      if (!cargarUsuarioDesdeToken(storedToken)) {
        // Si cargarUsuarioDesdeToken devuelve false (ej. token expirado o usuario inactivo), limpiamos.
        logout(); // Llama a logout para limpiar todo
      }
    }
    setIsLoading(false); 
  }, []); // Se ejecuta solo al montar

  const login = async (loginDto: LoginDto): Promise<RespuestaAuthDto> => {
    try {
      const response = await apiClient.post<RespuestaAuthDto>('/api/auth/login', loginDto);
      const { token: apiToken, estaActivo } = response.data; 
      
      if (!estaActivo) {
        logout(); 
        throw new Error("La cuenta no está activa. Por favor, contacte a un administrador.");
      }

      localStorage.setItem('authToken', apiToken);
      setToken(apiToken);
      cargarUsuarioDesdeToken(apiToken); // Decodifica el nuevo token para obtener todos los datos
      
      return response.data; 
    } catch (error: any) {
      logout(); 
      throw error; 
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('usuarioActual'); // Asegurarse de limpiar esto también
    setToken(null);
    setUsuarioActual(null);
    setIsAuthenticated(false);
  };

  const tienePermiso = (permisoRequerido: string): boolean => {
    if (!isAuthenticated || !usuarioActual || !usuarioActual.estaActivo) {
      return false;
    }
    return usuarioActual.permisos?.includes(permisoRequerido) || false;
  };

  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <Spinner animation="border" variant="primary" />
        <p className="ms-2">Cargando aplicación...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, usuarioActual, token, login, logout, isLoading, tienePermiso }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};