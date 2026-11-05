import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // ✅ SUPPRESSION AUTOMATIQUE DES CONSOLE.LOG EN PRODUCTION
  esbuild: {
    drop: ['console', 'debugger'],
  },
})