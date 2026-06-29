import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CopyFlow',
  description: 'Gestiona tus flujos de ventas por WhatsApp',
  applicationName: 'CopyFlow',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'CopyFlow',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0E1116',
}

// Avoid flash by setting the theme class before React hydrates.
// Dark is the default; light is opt-in via the `light` class.
const themeInitScript = `
(function(){try{
  var t=localStorage.getItem('copyflow-theme');
  if(t==='light'){document.documentElement.classList.add('light');}
}catch(e){}})();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-app-bg text-app-text h-screen overflow-hidden">
        {children}
      </body>
    </html>
  )
}
