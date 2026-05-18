import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TattoFlow',
  description: 'Gestiona tus flujos de ventas por WhatsApp',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-[#0f0f0f] text-[#f0f0f0] h-screen overflow-hidden">
        {children}
      </body>
    </html>
  )
}
