import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import apiClient from '../services/apiClient'; // Ajusta la ruta si es necesario
import type { LoginDto, RespuestaAuthDto, UsuarioActual } from '../types/auth'; // Importa los tipos

// Define el tipo para el valor del contexto
interface AuthContextType {
  isAuthenticated: boolean;
  usuarioActual: UsuarioActual | null;
  token: string | null;
  login: (loginDto: LoginDto) => Promise<RespuestaAuthDto>; // Ahora devuelve RespuestaAuthDto
  logout: () => void;
  isLoading: boolean; // Para manejar el estado de carga inicial del token
}

// Crea el contexto con un valor por defecto undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor del contexto
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [usuarioActual, setUsuarioActual] = useState<UsuarioActual | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState<boolean>(true); // Inicia como true

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      // TODO: En una aplicación real, deberías validar este token con el backend
      // o decodificarlo para obtener datos del usuario y verificar la expiración.
      // Por ahora, si existe, asumimos que el usuario está autenticado.
      // La llamada a apiClient ya configurará el token en las cabeceras.
      setToken(storedToken);
      setIsAuthenticated(true);
      // Aquí podrías decodificar el token para setear `usuarioActual` si es necesario
      // Por ejemplo, si guardaste el objeto usuario en localStorage al hacer login:
      const storedUser = localStorage.getItem('usuarioActual');
      if (storedUser) {
        try {
            setUsuarioActual(JSON.parse(storedUser));
        } catch (e) {
            console.error("Error al parsear usuarioActual de localStorage", e)
            // Si hay error, limpiar para evitar estado inconsistente
            localStorage.removeItem('usuarioActual');
            localStorage.removeItem('authToken');
            setIsAuthenticated(false);
            setToken(null);
        }
      } else {
          // Si no hay usuario pero sí token, podríamos necesitar una llamada a /api/auth/me (si existiera)
          // o forzar un logout si consideramos que el estado es inconsistente.
          // Por ahora, si solo hay token, el interceptor lo usará.
      }
    }
    setIsLoading(false); // Finaliza la carga después de verificar el token
  }, []);

  const login = async (loginDto: LoginDto): Promise<RespuestaAuthDto> => {
    try {
      const response = await apiClient.post<RespuestaAuthDto>('/api/auth/login', loginDto);
      const { token: apiToken, usuarioId, username, email, roles } = response.data;
      
      localStorage.setItem('authToken', apiToken);
      const currentUserData: UsuarioActual = { id: usuarioId, username, email, roles };
      localStorage.setItem('usuarioActual', JSON.stringify(currentUserData)); // Guardar info del usuario

      setToken(apiToken);
      setUsuarioActual(currentUserData);
      setIsAuthenticated(true);
      return response.data; // Devuelve la respuesta completa
    } catch (error) {
      // Limpiar estado en caso de error de login
      logout(); // Llama a logout para limpiar todo
      throw error; // Relanzar para que el componente de login pueda manejarlo (mostrar mensaje)
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('usuarioActual');
    setToken(null);
    setUsuarioActual(null);
    setIsAuthenticated(false);
    // Aquí podrías querer redirigir al usuario a la página de login usando tu router
    // navigate('/login');
  };

  // No renderizar hijos hasta que se complete la carga inicial del token
  if (isLoading) {
    return <p>Cargando aplicación...</p>; // O un spinner/loader más sofisticado
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, usuarioActual, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
