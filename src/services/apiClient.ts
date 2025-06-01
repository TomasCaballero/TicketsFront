import axios from 'axios';
// Importar InternalAxiosRequestConfig como un tipo
import type { InternalAxiosRequestConfig } from 'axios';

// Esta es la URL base de tu backend. Asegúrate de que sea la correcta.
// La obtuvimos de tu Swagger UI: https://localhost:7109
const API_BASE_URL: string = 'https://localhost:7109';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token JWT a las solicitudes
apiClient.interceptors.request.use(
  // Tipar 'config' correctamente.
  // En versiones más recientes de Axios, el tipo interno es InternalAxiosRequestConfig
  // que extiende AxiosRequestConfig. Usaremos InternalAxiosRequestConfig para mayor precisión.
  (config: InternalAxiosRequestConfig) => { 
    const token = localStorage.getItem('authToken'); // Obtén el token de donde lo guardes
    if (token) {
      // Asegurarse de que config.headers exista
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Opcional: Interceptor de respuesta para manejar errores globalmente (ej. 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response, // Simplemente devuelve la respuesta si es exitosa
  (error) => {
    if (error.response && error.response.status === 401) {
      // El token no es válido o ha expirado
      console.error('Error 401: No autorizado. Redirigiendo al login...');
      localStorage.removeItem('authToken'); // Limpiar token inválido
      // Aquí podrías redirigir al usuario a la página de login.
      // Esto depende de cómo manejes el enrutamiento (React Router).
      // Ejemplo: window.location.href = '/login'; (no ideal para SPAs, mejor usar el router)
    }
    return Promise.reject(error);
  }
);


export default apiClient;
