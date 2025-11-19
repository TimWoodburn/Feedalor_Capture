import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/feeds': 'http://localhost:5001',
      '/feed': 'http://localhost:5001',
      '/preview_decoder': 'http://localhost:5001',
      '/enqueue': 'http://localhost:5001'
    }
  }
})
