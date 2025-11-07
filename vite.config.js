import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // sabit port
    strictPort: true // eğer 5173 doluysa başka porta geçme, hata ver
  }
})
