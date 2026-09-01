'use client'

import { usePathname } from 'next/navigation'
import { BusinessAlerts } from '@/components/business-alerts'
import { ThemeProvider } from '@/components/theme-provider'
import { CompanyProvider } from '@/lib/company-context'
import { StockProvider } from '@/lib/stock-context'

const authPaths = new Set(['/login', '/registrarse', '/olvidar-contrasena', '/actualizar-contrasena'])

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = authPaths.has(pathname)

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {isAuthPage ? (
        children
      ) : (
        <CompanyProvider>
          <StockProvider>
            <BusinessAlerts />
            {children}
          </StockProvider>
        </CompanyProvider>
      )}
    </ThemeProvider>
  )
}
