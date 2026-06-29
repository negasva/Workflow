import type { MetadataRoute } from 'next'

// Installable PWA: lets the sales tool live on the phone home screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CopyFlow',
    short_name: 'CopyFlow',
    description: 'Gestiona tus flujos de ventas por WhatsApp',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0E1116',
    theme_color: '#0E1116',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
