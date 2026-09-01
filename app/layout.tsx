import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { AppProviders } from '@/components/app-providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'CRM - Transporte y Madera',
  description: 'Sistema de gestión para empresa de transporte y madera',
  icons: {
    icon: [{ url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background">
        <AppProviders>{children}</AppProviders>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}