import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import ssl from '@vitejs/plugin-basic-ssl'
import viteBasicSslPlugin from '@vitejs/plugin-basic-ssl'


// https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

// export default defineConfig({
//   plugins: [react(), viteBasicSslPlugin()],
//   server: {
//     https: {}, // Use an empty object to enable HTTPS with default settings
//     host: '0.0.0.0', // <-- permite recibir conexiones desde cualquier IP
//     port: 5173
//   }
// })

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Escucha en todas las interfaces
    port: 5173       // Puerto por defecto de Vite
  }
})