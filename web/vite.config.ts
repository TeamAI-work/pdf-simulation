import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Allow `import { SimSpecSchema } from '@pdf-sim/shared/simSpec'`
      '@pdf-sim/shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
  // KP-9 mitigation: configure pdfjs-dist worker explicitly
  // The actual worker import is done in PdfPane.tsx (Phase 6)
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to the Express server during development
      '/api': 'http://localhost:3001',
      '/sim': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
    },
  },
})
