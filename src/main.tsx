import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Tu componente App principal
import './index.css'; // O tus estilos globales
import { BrowserRouter } from 'react-router-dom'; // Asumiendo que usarás React Router
import { AuthProvider } from './context/AuthContext'; // Ajusta la ruta si es necesario
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter> {/* Envuelve con BrowserRouter si usas React Router */}
      <AuthProvider>  {/* Envuelve App con AuthProvider */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
