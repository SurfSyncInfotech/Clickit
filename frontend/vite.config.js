import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// /api and /uploads go to the Express backend
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:4000', '/uploads': 'http://localhost:4000' } },
})
