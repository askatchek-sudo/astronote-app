import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png'],
      manifest: {
        name: 'ASTRONOTE - Label Musical',
        short_name: 'ASTRONOTE',
        description: 'La plateforme de distribution musicale ASTRONOTE',
        theme_color: '#7c3aed', // Couleur violette de ta marque
        background_color: '#0f172a', // Couleur de fond sombre
        display: 'standalone', // Enlève la barre du navigateur une fois installé
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  esbuild: {
    drop: ['console', 'debugger'],
  },
})