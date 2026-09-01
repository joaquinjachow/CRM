'use client'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { type CompanyPermission } from '@/lib/company'
import { useCompany } from '@/lib/company-context'

interface PageShellProps {
  children?: ReactNode
}

function permissionForPath(pathname: string): CompanyPermission | null {
  if (pathname === '/') return 'dashboard:view'
  if (pathname === '/calcular-flete') return 'freight:view'
  if (pathname === '/stock' || pathname === '/ingreso-mercaderia') return 'stock:view'
  if (pathname === '/presupuestos') return 'quotes:view'
  if (pathname === '/pedidos') return 'orders:view'
  if (pathname === '/facturacion') return 'billing:view'
  if (pathname === '/equipamiento') return 'equipment:view'
  if (pathname === '/finanzas') return 'finance:view'
  if (pathname === '/usuarios') return 'users:manage'
  return null
}

export function PageShell({ children }: PageShellProps) {
  const pathname = usePathname()
  const { can, loading } = useCompany()
  const requiredPermission = permissionForPath(pathname)
  const isRestricted = !loading && requiredPermission && !can(requiredPermission)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="p-4 pt-16 lg:p-8 lg:pt-8">
          {isRestricted ? (
            <Card>
              <CardContent className="py-10 text-sm text-muted-foreground">
                No tenés permiso para ver esta sección. Pedile a un administrador de la empresa que actualice tu acceso.
              </CardContent>
            </Card>
          ) : children}
        </div>
      </main>
    </div>
  )
}
