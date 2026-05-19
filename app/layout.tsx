import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CopyFlow',
  description: 'Gestiona tus flujos de ventas por WhatsApp',
}

// Avoid flash by setting the theme class before React hydrates
const themeInitScript = `
(function(){try{
  var t=localStorage.getItem('copyflow-theme');
  if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
  if(t==='dark'){document.documentElement.classList.add('dark');}
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
