import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL: string = 'https://localhost:7109';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // NO establecer un Content-Type global aquí si vamos a enviar FormData.
  // Axios lo manejará automáticamente: 'application/json' para objetos,
  // y 'multipart/form-data' para instancias de FormData.
  // headers: {
  //   'Content-Type': 'application/json', // <--- ELIMINAR O COMENTAR ESTA LÍNEA
  // },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => { 
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Si el cuerpo de la solicitud es FormData, axios debería establecer
    // automáticamente el Content-Type a multipart/form-data.
    // No necesitamos hacer nada especial aquí para FormData.
    // Para otras solicitudes (POST/PUT con objetos JSON), axios también
    // debería establecer 'application/json' por defecto si config.data es un objeto.
    // Si no se establece automáticamente y es necesario para JSON:
    // if (!(config.data instanceof FormData) && config.headers && !config.headers['Content-Type']) {
    //   config.headers['Content-Type'] = 'application/json';
    // }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Error 401: No autorizado. Redirigiendo al login...');
      localStorage.removeItem('authToken');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getApiBaseUrl = (): string => {
    return apiClient.defaults.baseURL || '';
};

export default apiClient;
