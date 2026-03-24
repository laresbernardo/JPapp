import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.png'],
      manifest: {
        name: 'Ber & Maru | Japan 2026',
        short_name: 'Japan 2026',
        description: 'Travel itinerary and tools for our Japan 2026 trip',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'favicon.png',
            sizes: '640x640',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
