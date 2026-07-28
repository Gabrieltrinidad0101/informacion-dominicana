import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Allow importing the shared registry at projects/shared/ (outside this app root).
    fs: { allow: ['..'] },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-pdf': ['react-pdf'],
          'vendor-xlsx': ['xlsx'],
          'vendor-charts': ['lightweight-charts'],
        },
      },
    },
  },
})
