import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: { 
    watch: { usePolling: true },
    proxy: {
      '/service-providers': {
        target: 'http://localhost:5001/slates-59840/us-central1/serviceProviders',
        changeOrigin: true,
      },
      '/channels': {
        target: 'http://localhost:5001/slates-59840/us-central1/channels',
        changeOrigin: true,
      },
      '/generateDashboardLink': {
        target: 'http://localhost:5001/slates-59840/us-central1/generateDashboardLink',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  // By default, Vite uses 'public' dir for static assets that should be served as-is
  // No need to override publicDir unless you want to change from 'public' to something else
})
