import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/auth': {
        target: 'https://minicrm.apps.gravibase.ru',
        changeOrigin: true,
      },
      '/api': {
        target: 'https://minicrm.apps.gravibase.ru',
        changeOrigin: true,
      },
      '/application': {
        target: 'https://minicrm.apps.gravibase.ru',
        changeOrigin: true,
      },
      '/security': {
        target: 'https://minicrm.apps.gravibase.ru',
        changeOrigin: true,
      },
    },
  },
})
