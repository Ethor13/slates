import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
      '/schedule': {
        target: 'http://localhost:5001/slates-59840/us-central1/schedule',
        changeOrigin: true,
      }
    },
  }
})
