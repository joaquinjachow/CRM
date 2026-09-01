'use client'
import { useState } from 'react'
import { ArrowLeft, ClipboardList, Download, Eye, FileSpreadsheet, FileText, Plus, Trash2 } from 'lucide-react'
import { PageShell } from '@/components/page-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useStock } from '@/lib/stock-context'
import { exportarPresupuestoExcel, exportarPresupuestoPDF } from '@/lib/presupuesto-export'
import { formatDate, formatMoney, type PedidoItem, type Presupuesto } from '@/lib/stock-data'

export default function PresupuestosPage() {
  const { stock, presupuestos, crearPresupuesto } = useStock()
  const [vista, setVista] = useState<'lista' | 'nuevo'>('lista')
  const [cliente, setCliente] = useState('')
  const [stockItemId, setStockItemId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [items, setItems] = useState<Omit<PedidoItem, 'id'>[]>([])
  const [presupuestoDetalle, setPresupuestoDetalle] = useState<Presupuesto | null>(null)

  const stockSeleccionado = stock.find((item) => item.id === stockItemId)
  const cantidadNum = Number.parseInt(cantidad, 10) || 0
  const totalPresupuesto = items.reduce((sum, item) => sum + item.total, 0)

  const limpiarFormulario = () => {
    setCliente('')
    setStockItemId('')
    setCantidad('')
    setItems([])
    setVista('lista')
  }

  const agregarItem = () => {
    if (!stockSeleccionado || cantidadNum <= 0 || cantidadNum > stockSeleccionado.cantidad) return
    const itemExistente = items.find((item) => item.stockItemId === stockSeleccionado.id)
    const cantidadTotal = (itemExistente?.cantidad ?? 0) + cantidadNum
    if (cantidadTotal > stockSeleccionado.cantidad) return

    if (itemExistente) {
      setItems((actuales) =>
        actuales.map((item) =>
          item.stockItemId === stockSeleccionado.id
            ? { ...item, cantidad: cantidadTotal, total: cantidadTotal * item.precioLista }
            : item,
        ),
      )
    } else {
      setItems((actuales) => [
        ...actuales,
        {
          stockItemId: stockSeleccionado.id,
          codigo: stockSeleccionado.codigo,
          producto: stockSeleccionado.producto,
          medidas: stockSeleccionado.medidas,
          cantidad: cantidadNum,
          precioLista: stockSeleccionado.precioLista,
          total: cantidadNum * stockSeleccionado.precioLista,
        },
      ])
    }
    setStockItemId('')
    setCantidad('')
  }

  const confirmarPresupuesto = async () => {
    if (!cliente.trim() || items.length === 0) return
    const presupuesto = await crearPresupuesto(cliente.trim(), items)
    if (!presupuesto) return
    setCliente('')
    setStockItemId('')
    setCantidad('')
    setItems([])
    setVista('lista')
    setPresupuestoDetalle(presupuesto)
  }

  return (
    <PageShell>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {vista === 'nuevo' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={limpiarFormulario}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Volver a presupuestos"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {vista === 'lista' ? 'Presupuestos' : 'Nuevo Presupuesto'}
            </h1>
            <p className="text-muted-foreground">
              {vista === 'lista'
                ? 'Consultá presupuestos emitidos y volvé a exportarlos cuando lo necesites'
                : 'Armá un presupuesto con los productos y precios actuales del stock'}
            </p>
          </div>
        </div>
        {vista === 'lista' && (
          <Button onClick={() => setVista('nuevo')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo
          </Button>
        )}
      </div>
      {vista === 'lista' ? (
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Presupuestos emitidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {presupuestos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileSpreadsheet className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">Todavía no hay presupuestos emitidos</p>
                <p className="text-sm text-muted-foreground/70">
                  Creá uno para consultarlo y exportarlo después.
                </p>
                <Button onClick={() => setVista('nuevo')} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Crear presupuesto
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-muted-foreground">N° Presupuesto</TableHead>
                      <TableHead className="text-muted-foreground">Fecha</TableHead>
                      <TableHead className="text-muted-foreground">Cliente</TableHead>
                      <TableHead className="text-right text-muted-foreground">Total</TableHead>
                      <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {presupuestos.map((presupuesto) => (
                      <TableRow key={presupuesto.id} className="border-border/50">
                        <TableCell className="font-medium text-foreground">{presupuesto.id}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(presupuesto.fecha)}</TableCell>
                        <TableCell className="text-foreground">{presupuesto.cliente}</TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          ${formatMoney(presupuesto.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPresupuestoDetalle(presupuesto)}
                              className="text-muted-foreground hover:text-primary"
                              title="Consultar presupuesto"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => exportarPresupuestoPDF(presupuesto)}
                              className="text-muted-foreground hover:text-primary"
                              title="Exportar PDF"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => exportarPresupuestoExcel(presupuesto)}
                              className="text-muted-foreground hover:text-primary"
                              title="Exportar Excel"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border/50 bg-card lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-foreground">Agregar producto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente</Label>
                <Input
                  id="cliente"
                  value={cliente}
                  onChange={(event) => setCliente(event.target.value)}
                  placeholder="Nombre del cliente"
                  className="border-border/50 bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockItem">Producto (stock)</Label>
                <Select value={stockItemId} onValueChange={setStockItemId}>
                  <SelectTrigger id="stockItem" className="border-border/50 bg-background">
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {stock
                      .filter((item) => item.cantidad > 0)
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.producto} ({item.medidas}) — {formatMoney(item.cantidad)} p
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {stock.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Todavía no hay stock disponible. Registrá un ingreso de mercadería antes de crear un presupuesto.
                  </p>
                )}
              </div>
              {stockSeleccionado && (
                <p className="text-xs text-muted-foreground">
                  Disponible: <span className="font-medium text-foreground">{formatMoney(stockSeleccionado.cantidad)} paquetes</span>
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input
                  id="cantidad"
                  type="number"
                  min={1}
                  max={stockSeleccionado?.cantidad ?? undefined}
                  value={cantidad}
                  onChange={(event) => setCantidad(event.target.value)}
                  placeholder="0"
                  className="border-border/50 bg-background"
                />
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Total línea</span>
                  <span className="text-xl font-bold text-primary">
                    ${stockSeleccionado ? formatMoney((cantidadNum || 1) * stockSeleccionado.precioLista) : '0'}
                  </span>
                </div>
              </div>
              <Button
                onClick={agregarItem}
                className="w-full gap-2"
                disabled={!stockSeleccionado || cantidadNum <= 0 || cantidadNum > (stockSeleccionado?.cantidad ?? 0)}
              >
                <Plus className="h-4 w-4" />
                Agregar al presupuesto
              </Button>
              <p className="rounded-lg border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground">
                El presupuesto no descuenta ni reserva stock.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">Detalle del presupuesto</CardTitle>
              {items.length > 0 && (
                <Button onClick={confirmarPresupuesto} disabled={!cliente.trim()} className="gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Guardar presupuesto
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No hay productos agregados</p>
                  <p className="text-sm text-muted-foreground/70">
                    Seleccioná productos del stock para armar el presupuesto.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                          <TableHead className="text-muted-foreground">Cód.</TableHead>
                          <TableHead className="text-muted-foreground">Producto</TableHead>
                          <TableHead className="text-muted-foreground">Medidas</TableHead>
                          <TableHead className="text-right text-muted-foreground">Cant.</TableHead>
                          <TableHead className="text-right text-muted-foreground">P. Lista</TableHead>
                          <TableHead className="text-right text-muted-foreground">Total</TableHead>
                          <TableHead className="w-12" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.stockItemId} className="border-border/50">
                            <TableCell className="text-muted-foreground">{item.codigo}</TableCell>
                            <TableCell className="font-medium text-foreground">{item.producto}</TableCell>
                            <TableCell className="text-muted-foreground">{item.medidas}</TableCell>
                            <TableCell className="text-right font-medium text-foreground">{formatMoney(item.cantidad)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">${formatMoney(item.precioLista)}</TableCell>
                            <TableCell className="text-right font-medium text-foreground">${formatMoney(item.total)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setItems((actuales) => actuales.filter((actual) => actual.stockItemId !== item.stockItemId))}
                                className="text-muted-foreground hover:text-destructive"
                                aria-label={`Eliminar ${item.producto}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <div className="min-w-[220px] rounded-lg bg-primary/10 p-4 text-right">
                      <div className="flex justify-between gap-6">
                        <span className="font-medium text-muted-foreground">Total presupuesto</span>
                        <span className="text-2xl font-bold text-primary">${formatMoney(totalPresupuesto)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      <Dialog open={!!presupuestoDetalle} onOpenChange={() => setPresupuestoDetalle(null)}>
        <DialogContent className="max-w-2xl border-border/50 bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Presupuesto {presupuestoDetalle?.id}
            </DialogTitle>
          </DialogHeader>
          {presupuestoDetalle && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Cliente: </span>
                  <span className="font-medium text-foreground">{presupuestoDetalle.cliente}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha: </span>
                  <span className="font-medium text-foreground">{formatDate(presupuestoDetalle.fecha)}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Cód.</TableHead>
                      <TableHead className="text-muted-foreground">Producto</TableHead>
                      <TableHead className="text-muted-foreground">Medidas</TableHead>
                      <TableHead className="text-right text-muted-foreground">Cant.</TableHead>
                      <TableHead className="text-right text-muted-foreground">P. Lista</TableHead>
                      <TableHead className="text-right text-muted-foreground">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {presupuestoDetalle.items.map((item) => (
                      <TableRow key={item.id} className="border-border/50">
                        <TableCell className="text-muted-foreground">{item.codigo}</TableCell>
                        <TableCell className="font-medium text-foreground">{item.producto}</TableCell>
                        <TableCell className="text-muted-foreground">{item.medidas}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatMoney(item.cantidad)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">${formatMoney(item.precioLista)}</TableCell>
                        <TableCell className="text-right font-medium text-foreground">${formatMoney(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col-reverse gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => exportarPresupuestoPDF(presupuestoDetalle)} className="gap-2">
                    <FileText className="h-4 w-4" />
                    Exportar PDF
                  </Button>
                  <Button variant="outline" onClick={() => exportarPresupuestoExcel(presupuestoDetalle)} className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar Excel
                  </Button>
                </div>
                <div className="min-w-[200px] rounded-lg bg-primary/10 p-4 text-right">
                  <div className="flex justify-between gap-4">
                    <span className="font-medium text-muted-foreground">Total</span>
                    <span className="text-2xl font-bold text-primary">${formatMoney(presupuestoDetalle.total)}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                El presupuesto quedó guardado para consulta y exportación; no admite edición.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}