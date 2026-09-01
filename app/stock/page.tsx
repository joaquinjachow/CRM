'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PageShell } from '@/components/page-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Warehouse, Package } from 'lucide-react'
import { useStock } from '@/lib/stock-context'
import { tiposMadera, formatMoney, type TipoMadera } from '@/lib/stock-data'

export default function StockPage() {
  const { stock } = useStock()
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<TipoMadera | 'todos'>('todos')
  const [filtroMedida, setFiltroMedida] = useState<string>('todas')

  const medidasUnicas = useMemo(
    () => Array.from(new Set(stock.map((s) => s.medidas))).sort(),
    [stock],
  )

  const stockFiltrado = useMemo(() => {
    return stock.filter((item) => {
      if (filtroTipo !== 'todos' && item.tipo !== filtroTipo) return false
      if (filtroMedida !== 'todas' && item.medidas !== filtroMedida) return false
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase()
        return (
          item.producto.toLowerCase().includes(q) ||
          item.medidas.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [stock, busqueda, filtroTipo, filtroMedida])

  const totalItems = stockFiltrado.reduce((sum, i) => sum + i.cantidad, 0)
  const totalValor = stockFiltrado.reduce((sum, i) => sum + i.cantidad * i.precioLista, 0)

  return (
    <PageShell>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Stock</h1>
            <p className="text-muted-foreground">
              Consulta el inventario actual de productos
            </p>
          </div>
          {/* Stats rápidos */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="border-border/50 bg-card">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Productos distintos</p>
                  <p className="text-xl font-bold text-foreground">{stockFiltrado.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Warehouse className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unidades totales</p>
                  <p className="text-xl font-bold text-foreground">{formatMoney(totalItems)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Warehouse className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor total del stock</p>
                  <p className="text-xl font-bold text-foreground">${formatMoney(totalValor)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Filtros compactos */}
          <Card className="mb-6 border-border/50 bg-card">
            <CardContent className="space-y-3 p-4">
              {/* Searchbar + Select medidas en la misma fila */}
              <div className="flex items-center gap-3">
                <div className="relative max-w-xs flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto o medida..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="border-border/50 bg-background pl-10"
                  />
                </div>
                <Select value={filtroMedida} onValueChange={setFiltroMedida}>
                  <SelectTrigger className="w-44 border-border/50 bg-background">
                    <SelectValue placeholder="Medidas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las medidas</SelectItem>
                    {medidasUnicas.map((medida) => (
                      <SelectItem key={medida} value={medida}>
                        {medida}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Tipo de madera chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tipo:
                </span>
                {tiposMadera.map((tipo) => (
                  <button
                    key={tipo.value}
                    onClick={() => setFiltroTipo(tipo.value)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                      filtroTipo === tipo.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {tipo.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          {/* Tabla de stock estilo Excel */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Warehouse className="h-5 w-5 text-primary" />
                Inventario
                {(filtroTipo !== 'todos' || filtroMedida !== 'todas' || busqueda.trim()) && (
                  <Badge variant="secondary" className="ml-2">
                    {stockFiltrado.length} resultados
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-y border-border bg-muted/40">
                      <th className="border-x border-border px-3 py-2.5 text-center font-semibold text-muted-foreground">Cód.</th>
                      <th className="border-x border-border px-3 py-2.5 text-center font-semibold text-muted-foreground">Producto</th>
                      <th className="border-x border-border px-3 py-2.5 text-center font-semibold text-muted-foreground">Medidas</th>
                      <th className="border-x border-border px-3 py-2.5 text-center font-semibold text-muted-foreground">Cantidad</th>
                      <th className="border-x border-border px-3 py-2.5 text-center font-semibold text-muted-foreground">Precio Lista</th>
                      <th className="border-x border-border px-3 py-2.5 text-center font-semibold text-muted-foreground">Valor Total</th>
                      <th className="border-x border-border px-3 py-2.5 text-center font-semibold text-muted-foreground">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockFiltrado.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <Warehouse className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            {stock.length === 0 ? 'Todavia no hay productos cargados' : 'No se encontraron productos'}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground/70">
                            {stock.length === 0
                              ? 'Registra un ingreso de mercaderia para comenzar a controlar el stock.'
                              : 'Cambia o limpia los filtros para ver otros productos.'}
                          </p>
                          {stock.length === 0 && (
                            <Button asChild size="sm" className="mt-4">
                              <Link href="/ingreso-mercaderia">Registrar ingreso</Link>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      stockFiltrado.map((item) => (
                        <tr key={item.id} className="border-b border-border transition-colors hover:bg-muted/30">
                          <td className="border-x border-border px-3 py-2 text-center text-muted-foreground">{item.codigo}</td>
                          <td className="border-x border-border px-3 py-2 text-center font-medium text-foreground">{item.producto}</td>
                          <td className="border-x border-border px-3 py-2 text-center text-muted-foreground">{item.medidas}</td>
                          <td className="border-x border-border px-3 py-2 text-center font-medium text-foreground">
                            {formatMoney(item.cantidad)}
                          </td>
                          <td className="border-x border-border px-3 py-2 text-center text-muted-foreground">
                            ${formatMoney(item.precioLista)}
                          </td>
                          <td className="border-x border-border px-3 py-2 text-center font-medium text-foreground">
                            ${formatMoney(item.cantidad * item.precioLista)}
                          </td>
                          <td className="border-x border-border px-3 py-2 text-center">
                            {item.cantidad === 0 ? (
                              <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30">Sin stock</Badge>
                            ) : item.cantidad < 50 ? (
                              <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">Bajo</Badge>
                            ) : (
                              <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">OK</Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
    </PageShell>
  )
}