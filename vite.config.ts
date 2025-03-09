import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { 
    watch: { usePolling: true },
    headers: {
      // Add cache headers for images and static assets
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Add hash to chunk names for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
})
