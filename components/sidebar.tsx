'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  Home, Truck, Users, Package, BarChart3, FileText, Settings,
  Calculator, MapPin, CreditCard, Bell, HelpCircle, Menu, Sun, Moon,
  Warehouse, ClipboardList, PackagePlus, ChevronDown,
} from 'lucide-react'

interface MenuItem {
  icon: React.ElementType
  label: string
  href: string
}

const menuActivo: MenuItem[] = [
  { icon: Home, label: 'Inicio', href: '/' },
  { icon: Calculator, label: 'Calcular Flete', href: '/calcular-flete' },
  { icon: Warehouse, label: 'Stock', href: '/stock' },
  { icon: ClipboardList, label: 'Pedidos', href: '/pedidos' },
  { icon: PackagePlus, label: 'Ingreso Mercadería', href: '/ingreso-mercaderia' },
  { icon: FileText, label: 'Facturación', href: '/facturacion' },
]

const menuPendiente: MenuItem[] = [
  { icon: Truck, label: 'Flota de Vehículos', href: '#' },
  { icon: Users, label: 'Clientes', href: '#' },
  { icon: Package, label: 'Envíos', href: '#' },
  { icon: MapPin, label: 'Rutas', href: '#' },
  { icon: BarChart3, label: 'Reportes', href: '#' },
  { icon: CreditCard, label: 'Pagos', href: '#' },
  { icon: Bell, label: 'Notificaciones', href: '#' },
  { icon: Settings, label: 'Configuración', href: '#' },
  { icon: HelpCircle, label: 'Ayuda', href: '#' },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex cursor-pointer items-center justify-center rounded-lg p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
      aria-label="Cambiar tema"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  )
}

function SidebarContent() {
  const pathname = usePathname()
  const [masOpcionesAbierto, setMasOpcionesAbierto] = useState(false)

  const renderMenuItem = (item: MenuItem) => {
    const isActive = pathname === item.href
    const isPendiente = item.href === '#'

    if (!isPendiente) {
      return (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            isActive
              ? 'bg-sidebar-accent text-sidebar-primary'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </Link>
      )
    }
    return (
      <button
        key={item.label}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/50 transition-colors"
        disabled
      >
        <item.icon className="h-5 w-5" />
        {item.label}
      </button>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Logo"
            width={140}
            height={40}
            className="h-10 w-auto"
          />
        </div>
        <ThemeToggle />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          Menu Principal
        </p>
        {menuActivo.slice(0, 2).map(renderMenuItem)}
        <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          Inventario
        </p>
        {menuActivo.slice(2, 5).map(renderMenuItem)}
        <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          Finanzas
        </p>
        {menuActivo.slice(5).map(renderMenuItem)}

        {/* Más opciones colapsable */}
        <div className="mt-6">
          <button
            onClick={() => setMasOpcionesAbierto(!masOpcionesAbierto)}
            className="flex w-full items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground/80"
          >
            Más opciones
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                masOpcionesAbierto && 'rotate-180',
              )}
            />
          </button>
          {masOpcionesAbierto && (
            <div className="mt-2 space-y-1">
              {menuPendiente.map(renderMenuItem)}
            </div>
          )}
        </div>
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
            JD
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">Juan Diaz</p>
            <p className="text-xs text-sidebar-foreground/60">Administrador</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-card">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-sidebar p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu de navegacion</SheetTitle>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>
    </>
  )
}
