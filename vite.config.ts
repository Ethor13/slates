import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: { 
    watch: { usePolling: true },
    proxy: {
      // Redirect /i requests to the Firebase Functions emulator
      '/i': {
        target: 'http://localhost:5001/slates-59840/us-central1/serveImage',
        changeOrigin: true,
      },
      '/service-providers': {
        target: 'http://localhost:5001/slates-59840/us-central1/serviceProviders',
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
