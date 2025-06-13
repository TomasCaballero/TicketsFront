import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

// const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => { 
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    
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
    }
    return Promise.reject(error);
  }
);

export const getApiBaseUrl = (): string => {
    return apiClient.defaults.baseURL || '';
};

export default apiClient;
