'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PageShell } from '@/components/page-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Download, Trash2, Eye, FileText, Check, ClipboardList } from 'lucide-react'
import { useStock } from '@/lib/stock-context'
import {
  productosDisponibles,
  productoPorCodigo,
  codigoPorProducto,
  formatMoney,
  formatDate,
  calcularTotalesLinea,
  IVA_RATE,
  type Factura,
  type ItemFacturaLinea,
} from '@/lib/stock-data'
import * as XLSX from 'xlsx'

interface ItemFactura extends ItemFacturaLinea {
  id: string
}

function FacturacionPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const desdePedidoId = searchParams.get('desde_pedido')

  const { facturas, crearFactura, obtenerPedido } = useStock()

  const [vista, setVista] = useState<'lista' | 'nueva'>('lista')
  const [cliente, setCliente] = useState('')
  const [items, setItems] = useState<ItemFactura[]>([])
  const [codigo, setCodigo] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState('')
  const [cantidadXPaquete, setCantidadXPaquete] = useState('')
  const [medidas, setMedidas] = useState('')
  const [precioLista, setPrecioLista] = useState('')
  const [facturaDetalle, setFacturaDetalle] = useState<Factura | null>(null)
  const [pedidoPrellenado, setPedidoPrellenado] = useState(false)

  useEffect(() => {
    if (desdePedidoId && !pedidoPrellenado) {
      const pedido = obtenerPedido(desdePedidoId)
      if (pedido) {
        setCliente(pedido.cliente)
        const itemsFactura: ItemFactura[] = pedido.items.map((item) => {
          const { totalSinIva, totalConIva } = calcularTotalesLinea(item.cantidad, item.precioLista)
          return {
            id: crypto.randomUUID(),
            codigo: item.codigo,
            producto: item.producto,
            medidas: item.medidas,
            cantidadXPaquete: item.cantidad,
            precioLista: item.precioLista,
            totalSinIva,
            totalConIva,
          }
        })
        setItems(itemsFactura)
        setVista('nueva')
        setPedidoPrellenado(true)
      }
    }
  }, [desdePedidoId, obtenerPedido, pedidoPrellenado])

  const cantidadXPaqueteNum = parseFloat(cantidadXPaquete) || 0
  const precioListaNum = parseFloat(precioLista) || 0
  const totalesLinea =
    cantidadXPaqueteNum > 0 && precioListaNum > 0
      ? calcularTotalesLinea(cantidadXPaqueteNum, precioListaNum)
      : { totalSinIva: 0, iva: 0, totalConIva: 0 }

  const handleCodigoChange = (value: string) => {
    setCodigo(value)
    const codigoNum = parseInt(value, 10)
    const producto = productoPorCodigo(codigoNum)
    if (producto) {
      setProductoSeleccionado(producto)
    }
  }

  const handleProductoChange = (value: string) => {
    setProductoSeleccionado(value)
    const codigoProducto = codigoPorProducto(value)
    if (codigoProducto !== undefined) {
      setCodigo(String(codigoProducto))
    }
  }

  const limpiarCamposProducto = () => {
    setCodigo('')
    setProductoSeleccionado('')
    setCantidadXPaquete('')
    setMedidas('')
    setPrecioLista('')
  }

  const volverALista = () => {
    setVista('lista')
    setCliente('')
    setItems([])
    limpiarCamposProducto()
    setPedidoPrellenado(false)
    if (desdePedidoId) {
      router.replace('/facturacion')
    }
  }

  const agregarItem = () => {
    if (!productoSeleccionado || !cantidadXPaquete || !medidas.trim() || !precioLista) return
    const codigoNum = codigoPorProducto(productoSeleccionado) ?? parseInt(codigo, 10)
    if (!codigoNum || codigoNum < 1 || codigoNum > 12) return
    const { totalSinIva, totalConIva } = calcularTotalesLinea(cantidadXPaqueteNum, precioListaNum)
    const nuevoItem: ItemFactura = {
      id: crypto.randomUUID(),
      codigo: codigoNum,
      producto: productoSeleccionado,
      medidas: medidas.trim(),
      cantidadXPaquete: cantidadXPaqueteNum,
      precioLista: precioListaNum,
      totalSinIva,
      totalConIva,
    }
    setItems((prev) => [...prev, nuevoItem])
    limpiarCamposProducto()
  }

  const eliminarItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const totalFacturaSinIva = items.reduce((sum, item) => sum + item.totalSinIva, 0)
  const totalFacturaConIva = items.reduce((sum, item) => sum + item.totalConIva, 0)
  const totalIvaFactura = totalFacturaConIva - totalFacturaSinIva

  const confirmarFactura = () => {
    if (!cliente.trim() || items.length === 0) return
    const itemsSinId: ItemFacturaLinea[] = items.map(({ id: _id, ...rest }) => rest)
    crearFactura(cliente.trim(), itemsSinId, desdePedidoId ?? undefined)
    volverALista()
  }

  const exportarExcel = () => {
    if (items.length === 0) return
    const datosExport = items.map((item) => ({
      Código: item.codigo,
      Producto: item.producto,
      Medidas: item.medidas,
      'Cantidad x Paquete': item.cantidadXPaquete,
      'Precio de lista': item.precioLista,
      'Total sin IVA': item.totalSinIva,
      IVA: item.totalConIva - item.totalSinIva,
      'Total con IVA': item.totalConIva,
    }))
    datosExport.push({
      Código: 0,
      Producto: 'TOTAL',
      Medidas: '',
      'Cantidad x Paquete': 0,
      'Precio de lista': 0,
      'Total sin IVA': totalFacturaSinIva,
      IVA: totalIvaFactura,
      'Total con IVA': totalFacturaConIva,
    })
    const ws = XLSX.utils.json_to_sheet(datosExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Factura')
    ws['!cols'] = [
      { wch: 8 }, { wch: 22 }, { wch: 14 }, { wch: 16 },
      { wch: 14 }, { wch: 15 }, { wch: 12 }, { wch: 15 },
    ]
    XLSX.writeFile(wb, `factura_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pagada':
        return <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">Pagada</Badge>
      case 'pendiente':
        return <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">Pendiente</Badge>
      case 'vencida':
        return <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30">Vencida</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  return (
    <PageShell>
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {vista === 'nueva' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={volverALista}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  {vista === 'lista'
                    ? 'Facturación'
                    : desdePedidoId
                      ? `Factura desde Pedido ${desdePedidoId}`
                      : 'Nueva Factura'}
                </h1>
                <p className="text-muted-foreground">
                  {vista === 'lista'
                    ? 'Gestiona y consulta tus facturas'
                    : desdePedidoId
                      ? 'Revisá los datos del pedido, editá lo que necesites y confirmá la factura'
                      : 'Crea una nueva factura agregando productos'}
                </p>
              </div>
            </div>
            {vista === 'lista' && (
              <Button onClick={() => setVista('nueva')} className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Factura
              </Button>
            )}
          </div>

          {vista === 'lista' ? (
            <Card className="border-border/50 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <FileText className="h-5 w-5 text-primary" />
                  Facturas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-muted-foreground">N° Factura</TableHead>
                        <TableHead className="text-muted-foreground">Fecha</TableHead>
                        <TableHead className="text-muted-foreground">Cliente</TableHead>
                        <TableHead className="text-right text-muted-foreground">Total</TableHead>
                        <TableHead className="text-muted-foreground">Estado</TableHead>
                        <TableHead className="text-muted-foreground">Origen</TableHead>
                        <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facturas.map((factura) => (
                        <TableRow key={factura.id} className="border-border/50">
                          <TableCell className="font-medium text-foreground">
                            {factura.id}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(factura.fecha)}
                          </TableCell>
                          <TableCell className="text-foreground">{factura.cliente}</TableCell>
                          <TableCell className="text-right font-medium text-foreground">
                            ${formatMoney(factura.totalConIva)}
                          </TableCell>
                          <TableCell>{getEstadoBadge(factura.estado)}</TableCell>
                          <TableCell>
                            {factura.desdePedidoId ? (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <ClipboardList className="h-3 w-3" />
                                {factura.desdePedidoId}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Manual</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setFacturaDetalle(factura)}
                              className="text-muted-foreground hover:text-primary"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
                    <Label htmlFor="cliente">Cliente</Label>
                    <Input
                      id="cliente"
                      value={cliente}
                      onChange={(e) => setCliente(e.target.value)}
                      placeholder="Nombre del cliente"
                      className="border-border/50 bg-background"
                    />
                  </div>
                  <div className="grid grid-cols-[72px_1fr] gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="codigo">Código</Label>
                      <Input
                        id="codigo"
                        type="number"
                        min={1}
                        max={12}
                        value={codigo}
                        onChange={(e) => handleCodigoChange(e.target.value)}
                        placeholder="1-12"
                        className="border-border/50 bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="producto">Producto</Label>
                      <Select value={productoSeleccionado} onValueChange={handleProductoChange}>
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
                    <Label htmlFor="cantidadXPaquete">Cantidad x paquete</Label>
                    <Input
                      id="cantidadXPaquete"
                      type="number"
                      min={0}
                      value={cantidadXPaquete}
                      onChange={(e) => setCantidadXPaquete(e.target.value)}
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
                  <div className="space-y-2 rounded-lg bg-primary/10 p-3">
                    <p className="text-xs text-muted-foreground">
                      Cantidad × paquete × precio de lista
                    </p>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm text-muted-foreground">Sin IVA</span>
                      <span className="text-lg font-semibold text-foreground">
                        ${formatMoney(totalesLinea.totalSinIva)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2 border-t border-primary/20 pt-2">
                      <span className="text-sm text-muted-foreground">
                        Con IVA ({IVA_RATE * 100}%)
                      </span>
                      <span className="text-xl font-bold text-primary">
                        ${formatMoney(totalesLinea.totalConIva)}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={agregarItem}
                    className="w-full gap-2"
                    disabled={
                      !productoSeleccionado ||
                      !cantidadXPaquete ||
                      !medidas.trim() ||
                      !precioLista ||
                      totalesLinea.totalSinIva <= 0
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Agregar a Factura
                  </Button>
                </CardContent>
              </Card>

              {/* Detalle */}
              <Card className="border-border/50 bg-card lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="text-foreground">
                    {desdePedidoId ? 'Detalle de Factura (desde pedido)' : 'Detalle de Factura'}
                  </CardTitle>
                  <div className="flex gap-2">
                    {items.length > 0 && (
                      <>
                        <Button onClick={exportarExcel} variant="outline" className="gap-2">
                          <Download className="h-4 w-4" />
                          Excel
                        </Button>
                        <Button
                          onClick={confirmarFactura}
                          disabled={!cliente.trim()}
                          className="gap-2"
                        >
                          <Check className="h-4 w-4" />
                          Confirmar Factura
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {desdePedidoId && items.length > 0 && (
                    <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-3">
                      <p className="text-sm text-primary">
                        Esta factura se generó desde el pedido <strong>{desdePedidoId}</strong>.
                        Podés editar, agregar o eliminar productos antes de confirmar.
                      </p>
                    </div>
                  )}
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
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
                              <TableHead className="text-right text-muted-foreground">Cant.×Paq.</TableHead>
                              <TableHead className="text-right text-muted-foreground">P. lista</TableHead>
                              <TableHead className="text-right text-muted-foreground">Sin IVA</TableHead>
                              <TableHead className="text-right text-muted-foreground">Con IVA</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((item) => (
                              <TableRow key={item.id} className="border-border/50">
                                <TableCell className="text-muted-foreground">{item.codigo}</TableCell>
                                <TableCell className="font-medium text-foreground">
                                  {item.producto}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {item.medidas}
                                </TableCell>
                                <TableCell className="text-right font-medium text-foreground">
                                  {formatMoney(item.cantidadXPaquete)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  ${formatMoney(item.precioLista)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  ${formatMoney(item.totalSinIva)}
                                </TableCell>
                                <TableCell className="text-right font-medium text-foreground">
                                  ${formatMoney(item.totalConIva)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => eliminarItem(item.id)}
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
                          <div className="flex justify-between gap-6 text-sm">
                            <span className="text-muted-foreground">Subtotal sin IVA</span>
                            <span className="font-medium text-foreground">
                              ${formatMoney(totalFacturaSinIva)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-6 text-sm">
                            <span className="text-muted-foreground">IVA ({IVA_RATE * 100}%)</span>
                            <span className="font-medium text-foreground">
                              ${formatMoney(totalIvaFactura)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-6 border-t border-primary/20 pt-2">
                            <span className="font-medium text-muted-foreground">Total con IVA</span>
                            <span className="text-2xl font-bold text-primary">
                              ${formatMoney(totalFacturaConIva)}
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
          <Dialog open={!!facturaDetalle} onOpenChange={() => setFacturaDetalle(null)}>
            <DialogContent className="max-w-2xl border-border/50 bg-card">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <FileText className="h-5 w-5 text-primary" />
                  Factura {facturaDetalle?.id}
                </DialogTitle>
              </DialogHeader>
              {facturaDetalle && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Cliente: </span>
                      <span className="font-medium text-foreground">{facturaDetalle.cliente}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fecha: </span>
                      <span className="font-medium text-foreground">
                        {formatDate(facturaDetalle.fecha)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Estado: </span>
                      {getEstadoBadge(facturaDetalle.estado)}
                    </div>
                    {facturaDetalle.desdePedidoId && (
                      <div>
                        <span className="text-muted-foreground">Pedido: </span>
                        <Badge variant="outline" className="gap-1 text-xs">
                          <ClipboardList className="h-3 w-3" />
                          {facturaDetalle.desdePedidoId}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                          <TableHead className="text-muted-foreground">Cód.</TableHead>
                          <TableHead className="text-muted-foreground">Producto</TableHead>
                          <TableHead className="text-muted-foreground">Medidas</TableHead>
                          <TableHead className="text-right text-muted-foreground">Cant.×Paq.</TableHead>
                          <TableHead className="text-right text-muted-foreground">P. lista</TableHead>
                          <TableHead className="text-right text-muted-foreground">Con IVA</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {facturaDetalle.items.map((item, index) => (
                          <TableRow key={index} className="border-border/50">
                            <TableCell className="text-muted-foreground">{item.codigo}</TableCell>
                            <TableCell className="font-medium text-foreground">
                              {item.producto}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{item.medidas}</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatMoney(item.cantidadXPaquete)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              ${formatMoney(item.precioLista)}
                            </TableCell>
                            <TableCell className="text-right font-medium text-foreground">
                              ${formatMoney(item.totalConIva)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-end pt-4">
                    <div className="min-w-[200px] space-y-2 rounded-lg bg-primary/10 p-4 text-right">
                      <div className="flex justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">Sin IVA</span>
                        <span className="font-medium text-foreground">
                          ${formatMoney(facturaDetalle.totalSinIva)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 border-t border-primary/20 pt-2">
                        <span className="font-medium text-muted-foreground">Con IVA</span>
                        <span className="text-2xl font-bold text-primary">
                          ${formatMoney(facturaDetalle.totalConIva)}
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

export default function FacturacionPage() {
  return (
    <Suspense fallback={<PageShell />}>
      <FacturacionPageContent />
    </Suspense>
  )
}
