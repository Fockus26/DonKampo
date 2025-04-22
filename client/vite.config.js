import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({ 
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // Limitar el tamaño de los archivos a cachear a 5 MB
        globIgnores: ['assets/index-DUDElYX9.js', 'images/33.png'],
      },
      manifest: {
        name: 'Don Kampo',
        short_name: 'DK',
        description: 'Bienvenido a Don Kampo',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'images/icon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'images/icon.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  server: {
    https: false,  // Desactiva HTTPS en desarrollo
    host: true, // '0.0.0.0'
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://don-kampo-api-5vf3.onrender.com',  // Usa HTTP en lugar de HTTPS para el backend local
        changeOrigin: true,
        secure: false, // Desactiva la verificación de certificado
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500, // Aumenta el límite del tamaño de chunk a 1500 KB
    outDir: 'dist', // Asegura que la salida se realice en la carpeta dist
    sourcemap: true, // Incluye mapas de fuente para depuración en producción
  },
  resolve: {
    alias: {
      'css': path.resolve(__dirname, 'src/css'),
      'utils': path.resolve(__dirname, 'src/utils'),
      'assets': path.resolve(__dirname, 'src/assets'),
      'components': path.resolve(__dirname, 'src/components'),
    },
  },
});
