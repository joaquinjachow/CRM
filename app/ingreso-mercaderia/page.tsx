'use client'
import { useState } from 'react'
import { PageShell } from '@/components/page-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Plus, Trash2, Eye, PackagePlus, Download, MessageCircle } from 'lucide-react'
import { useStock } from '@/lib/stock-context'
import {
  formatMoney,
  formatDate,
  productosDisponibles,
  codigoPorProducto,
  type IngresoItem,
  type IngresoMercaderia,
} from '@/lib/stock-data'
import * as XLSX from 'xlsx'

export default function IngresoMercaderiaPage() {
  const { ingresos, crearIngreso } = useStock()
  const [vista, setVista] = useState<'lista' | 'nuevo'>('lista')
  const [proveedor, setProveedor] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState('')
  const [medidas, setMedidas] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [precioLista, setPrecioLista] = useState('')
  const [items, setItems] = useState<Omit<IngresoItem, 'id'>[]>([])
  const [ingresoDetalle, setIngresoDetalle] = useState<IngresoMercaderia | null>(null)

  const cantidadNum = parseInt(cantidad, 10) || 0
  const precioListaNum = parseFloat(precioLista) || 0
  const totalLinea = cantidadNum * precioListaNum

  const limpiarCampos = () => {
    setProductoSeleccionado('')
    setMedidas('')
    setCantidad('')
    setPrecioLista('')
  }

  const agregarItem = () => {
    if (!productoSeleccionado || !medidas.trim() || cantidadNum <= 0 || precioListaNum <= 0) return
    const codigoProducto = codigoPorProducto(productoSeleccionado)
    if (codigoProducto === undefined) return

    setItems((prev) => [
      ...prev,
        {
        codigo: codigoProducto,
        producto: productoSeleccionado,
        medidas: medidas.trim(),
        cantidad: cantidadNum,
        precioLista: precioListaNum,
        total: totalLinea,
      },
    ])
    limpiarCampos()
  }

  const eliminarItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const totalIngreso = items.reduce((sum, i) => sum + i.total, 0)

  const confirmarIngreso = () => {
    if (!proveedor.trim() || items.length === 0) return
    crearIngreso(proveedor.trim(), items)
    setProveedor('')
    setItems([])
    setVista('lista')
  }

  const limpiarFormulario = () => {
    setProveedor('')
    setItems([])
    limpiarCampos()
    setVista('lista')
  }

  const exportarExcel = (ingreso: IngresoMercaderia) => {
    const datosExport = ingreso.items.map((item) => ({
      Código: item.codigo,
      Producto: item.producto,
      Medidas: item.medidas,
      Cantidad: item.cantidad,
      'Precio Lista': item.precioLista,
      Total: item.total,
    }))
    datosExport.push({
      Código: 0,
      Producto: 'TOTAL',
      Medidas: '',
      Cantidad: 0,
      'Precio Lista': 0,
      Total: ingreso.total,
    })
    const ws = XLSX.utils.json_to_sheet(datosExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Ingreso')
    ws['!cols'] = [
      { wch: 8 },
      { wch: 22 },
      { wch: 14 },
      { wch: 10 },
      { wch: 14 },
      { wch: 14 },
    ]
    XLSX.writeFile(wb, `ingreso_${ingreso.id}.xlsx`)
  }

  const exportarWhatsApp = (ingreso: IngresoMercaderia) => {
    const lineas = ingreso.items
      .map(
        (item, i) =>
          `${i + 1}. ${item.producto} (${item.medidas}) — ${formatMoney(item.cantidad)} uds × $${formatMoney(item.precioLista)} = *$${formatMoney(item.total)}*`,
      )
      .join('\n')

    const mensaje = `*INGRESO ${ingreso.id}*\n📅 Fecha: ${formatDate(ingreso.fecha)}\n🏭 Proveedor: ${ingreso.proveedor}\n\n📦 Detalle:\n${lineas}\n\n💰 *Total: $${formatMoney(ingreso.total)}*`
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank')
  }

  return (
    <PageShell>
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {vista === 'nuevo' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={limpiarFormulario}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  {vista === 'lista' ? 'Ingreso de Mercadería' : 'Nuevo Ingreso'}
                </h1>
                <p className="text-muted-foreground">
                  {vista === 'lista'
                    ? 'Registra las entradas de mercadería al stock'
                    : 'Agrega productos al inventario desde un proveedor'}
                </p>
              </div>
            </div>
            {vista === 'lista' && (
              <Button onClick={() => setVista('nuevo')} className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Ingreso
              </Button>
            )}
          </div>

          {vista === 'lista' ? (
            <Card className="border-border/50 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <PackagePlus className="h-5 w-5 text-primary" />
                  Ingresos Registrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ingresos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <PackagePlus className="mb-4 h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No hay ingresos registrados</p>
                    <p className="text-sm text-muted-foreground/70">
                      Registra un nuevo ingreso de mercadería para empezar
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                          <TableHead className="text-muted-foreground">N° Ingreso</TableHead>
                          <TableHead className="text-muted-foreground">Fecha</TableHead>
                          <TableHead className="text-muted-foreground">Proveedor</TableHead>
                          <TableHead className="text-right text-muted-foreground">Total</TableHead>
                          <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ingresos.map((ingreso) => (
                          <TableRow key={ingreso.id} className="border-border/50">
                            <TableCell className="font-medium text-foreground">{ingreso.id}</TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(ingreso.fecha)}</TableCell>
                            <TableCell className="text-foreground">{ingreso.proveedor}</TableCell>
                            <TableCell className="text-right font-medium text-foreground">
                              ${formatMoney(ingreso.total)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setIngresoDetalle(ingreso)}
                                  className="text-muted-foreground hover:text-primary"
                                  title="Ver detalle"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => exportarExcel(ingreso)}
                                  className="text-muted-foreground hover:text-primary"
                                  title="Exportar Excel"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => exportarWhatsApp(ingreso)}
                                  className="text-muted-foreground hover:text-emerald-500"
                                  title="Enviar por WhatsApp"
                                >
                                  <MessageCircle className="h-4 w-4" />
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
              {/* Formulario */}
              <Card className="border-border/50 bg-card lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-foreground">Agregar Producto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="proveedor">Proveedor</Label>
                    <Input
                      id="proveedor"
                      value={proveedor}
                      onChange={(e) => setProveedor(e.target.value)}
                      placeholder="Nombre del proveedor"
                      className="border-border/50 bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="producto">Producto</Label>
                    <Select value={productoSeleccionado} onValueChange={setProductoSeleccionado}>
                      <SelectTrigger id="producto" className="border-border/50 bg-background">
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productosDisponibles.map((producto, index) => (
                          <SelectItem key={producto} value={producto}>
                            {index + 1} — {producto}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medidas">Medidas</Label>
                    <Input
                      id="medidas"
                      type="text"
                      value={medidas}
                      onChange={(e) => setMedidas(e.target.value)}
                      placeholder='Ej: 1 1/2 x 4'
                      className="border-border/50 bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cantidad">Cantidad</Label>
                    <Input
                      id="cantidad"
                      type="number"
                      min={1}
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      placeholder="0"
                      className="border-border/50 bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="precioLista">Precio de lista ($)</Label>
                    <Input
                      id="precioLista"
                      type="number"
                      min={0}
                      value={precioLista}
                      onChange={(e) => setPrecioLista(e.target.value)}
                      placeholder="0"
                      className="border-border/50 bg-background"
                    />
                  </div>
                  {cantidadNum > 0 && precioListaNum > 0 && (
                    <div className="space-y-2 rounded-lg bg-primary/10 p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm text-muted-foreground">Total línea</span>
                        <span className="text-xl font-bold text-primary">
                          ${formatMoney(totalLinea)}
                        </span>
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={agregarItem}
                    className="w-full gap-2"
                    disabled={!productoSeleccionado || !medidas.trim() || cantidadNum <= 0 || precioListaNum <= 0}
                  >
                    <Plus className="h-4 w-4" />
                    Agregar al Ingreso
                  </Button>
                </CardContent>
              </Card>

              {/* Detalle del ingreso */}
              <Card className="border-border/50 bg-card lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-foreground">Detalle del Ingreso</CardTitle>
                  {items.length > 0 && (
                    <Button onClick={confirmarIngreso} disabled={!proveedor.trim()} className="gap-2">
                      <PackagePlus className="h-4 w-4" />
                      Confirmar Ingreso
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <PackagePlus className="mb-4 h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No hay productos agregados</p>
                      <p className="text-sm text-muted-foreground/70">
                        Agrega productos usando el formulario de la izquierda
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
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((item, index) => (
                              <TableRow key={index} className="border-border/50">
                                <TableCell className="text-muted-foreground">{item.codigo}</TableCell>
                                <TableCell className="font-medium text-foreground">{item.producto}</TableCell>
                                <TableCell className="text-muted-foreground">{item.medidas}</TableCell>
                                <TableCell className="text-right font-medium text-foreground">
                                  {formatMoney(item.cantidad)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  ${formatMoney(item.precioLista)}
                                </TableCell>
                                <TableCell className="text-right font-medium text-foreground">
                                  ${formatMoney(item.total)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => eliminarItem(index)}
                                    className="text-muted-foreground hover:text-destructive"
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
                        <div className="min-w-[220px] space-y-2 rounded-lg bg-primary/10 p-4 text-right">
                          <div className="flex justify-between gap-6">
                            <span className="font-medium text-muted-foreground">Total Ingreso</span>
                            <span className="text-2xl font-bold text-primary">
                              ${formatMoney(totalIngreso)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Modal detalle */}
          <Dialog open={!!ingresoDetalle} onOpenChange={() => setIngresoDetalle(null)}>
            <DialogContent className="max-w-2xl border-border/50 bg-card">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <PackagePlus className="h-5 w-5 text-primary" />
                  Ingreso {ingresoDetalle?.id}
                </DialogTitle>
              </DialogHeader>
              {ingresoDetalle && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Proveedor: </span>
                      <span className="font-medium text-foreground">{ingresoDetalle.proveedor}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fecha: </span>
                      <span className="font-medium text-foreground">{formatDate(ingresoDetalle.fecha)}</span>
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
                        {ingresoDetalle.items.map((item) => (
                          <TableRow key={item.id} className="border-border/50">
                            <TableCell className="text-muted-foreground">{item.codigo}</TableCell>
                            <TableCell className="font-medium text-foreground">{item.producto}</TableCell>
                            <TableCell className="text-muted-foreground">{item.medidas}</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatMoney(item.cantidad)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              ${formatMoney(item.precioLista)}
                            </TableCell>
                            <TableCell className="text-right font-medium text-foreground">
                              ${formatMoney(item.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => exportarExcel(ingresoDetalle)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Exportar Excel
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => exportarWhatsApp(ingresoDetalle)}
                        className="gap-2"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </Button>
                    </div>
                    <div className="min-w-[200px] space-y-2 rounded-lg bg-primary/10 p-4 text-right">
                      <div className="flex justify-between gap-4">
                        <span className="font-medium text-muted-foreground">Total</span>
                        <span className="text-2xl font-bold text-primary">
                          ${formatMoney(ingresoDetalle.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
    </PageShell>
  )
}
