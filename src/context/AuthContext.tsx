import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import apiClient from '../services/apiClient';
import type { LoginDto, RegistroDto, RespuestaAuthDto, UsuarioActual } from '../types/auth';
import { jwtDecode, type JwtPayload } from 'jwt-decode';
import { Spinner } from 'react-bootstrap';


interface DecodedToken extends JwtPayload {
  nameid?: string;
  sub?: string;
  email?: string;
  role?: string | string[];
  Permission?: string | string[];
  nombre?: string;
  apellido?: string;
  estaActivo?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  usuarioActual: UsuarioActual | null;
  token: string | null;
  login: (loginDto: LoginDto) => Promise<RespuestaAuthDto>;
  logout: () => void;
  isLoading: boolean;
  tienePermiso: (permisoRequerido: string) => boolean;
  register: (registroDto: RegistroDto) => Promise<any>;
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
      if (decoded && decoded.exp && decoded.exp * 1000 > Date.now()) {
        const isActive = decoded.estaActivo === 'true';
        const userData: UsuarioActual = {
          id: decoded.nameid || '',
          username: decoded.sub || '',
          email: decoded.email || '',
          roles: parseRoles(decoded.role),
          permisos: parsePermissions(decoded.Permission),
          estaActivo: isActive,
          nombre: decoded.nombre,
          apellido: decoded.apellido,
        };
        setUsuarioActual(userData);
        setIsAuthenticated(isActive);
        localStorage.setItem('usuarioActual', JSON.stringify(userData));
        return isActive;
      } else {
        console.warn("Token expirado o inválido al cargar desde token.");
        return false;
      }
    } catch (e) {
      console.error("Error decodificando token al cargar:", e);
      return false;
    }
  };

  const register = async (registroDto: RegistroDto) => {
    return apiClient.post('/api/auth/register', registroDto);
  };


  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');

    if (storedToken) {
      setToken(storedToken);
      if (!cargarUsuarioDesdeToken(storedToken)) {
        logout();
      }
    }
    setIsLoading(false);
  }, []);

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
      cargarUsuarioDesdeToken(apiToken);

      return response.data;
    } catch (error: any) {
      logout();
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('usuarioActual');
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
    <AuthContext.Provider value={{ isAuthenticated, usuarioActual, token, login, logout, isLoading, tienePermiso, register }}>
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