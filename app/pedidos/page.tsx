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
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Trash2, Eye, ClipboardList, FileDown, MessageCircle, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useStock } from '@/lib/stock-context'
import { formatMoney, formatDate, type PedidoItem, type Pedido } from '@/lib/stock-data'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function PedidosPage() {
  const router = useRouter()
  const { stock, pedidos, crearPedido } = useStock()
  const [vista, setVista] = useState<'lista' | 'nuevo'>('lista')
  const [cliente, setCliente] = useState('')
  const [stockItemId, setStockItemId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [items, setItems] = useState<Omit<PedidoItem, 'id'>[]>([])
  const [pedidoDetalle, setPedidoDetalle] = useState<Pedido | null>(null)

  const stockSeleccionado = stock.find((s) => s.id === stockItemId)
  const cantidadNum = parseInt(cantidad, 10) || 0

  const agregarItem = () => {
    if (!stockSeleccionado || cantidadNum <= 0) return
    if (cantidadNum > stockSeleccionado.cantidad) return

    const yaAgregado = items.find((i) => i.stockItemId === stockItemId)
    const cantTotalPedida = (yaAgregado?.cantidad ?? 0) + cantidadNum
    if (cantTotalPedida > stockSeleccionado.cantidad) return

    if (yaAgregado) {
      setItems((prev) =>
        prev.map((i) =>
          i.stockItemId === stockItemId
            ? {
                ...i,
                cantidad: cantTotalPedida,
                total: cantTotalPedida * i.precioLista,
              }
            : i,
        ),
      )
    } else {
      setItems((prev) => [
        ...prev,
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

  const eliminarItem = (stockId: string) => {
    setItems((prev) => prev.filter((i) => i.stockItemId !== stockId))
  }

  const totalPedido = items.reduce((sum, i) => sum + i.total, 0)

  const confirmarPedido = () => {
    if (!cliente.trim() || items.length === 0) return
    const result = crearPedido(cliente.trim(), items)
    if (result) {
      setCliente('')
      setItems([])
      setVista('lista')
    }
  }

  const limpiarFormulario = () => {
    setCliente('')
    setItems([])
    setStockItemId('')
    setCantidad('')
    setVista('lista')
  }

  const exportarPDF = (pedido: Pedido) => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text(`Pedido ${pedido.id}`, 14, 22)
    doc.setFontSize(11)
    doc.text(`Fecha: ${formatDate(pedido.fecha)}`, 14, 32)
    doc.text(`Cliente: ${pedido.cliente}`, 14, 39)
    doc.text(`Estado: ${pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}`, 14, 46)

    autoTable(doc, {
      startY: 54,
      head: [['Cód.', 'Producto', 'Medidas', 'Cant.', 'P. Lista', 'Total']],
      body: pedido.items.map((item) => [
        item.codigo,
        item.producto,
        item.medidas,
        formatMoney(item.cantidad),
        `$${formatMoney(item.precioLista)}`,
        `$${formatMoney(item.total)}`,
      ]),
      foot: [['', '', '', '', 'TOTAL', `$${formatMoney(pedido.total)}`]],
      theme: 'grid',
      headStyles: { fillColor: [152, 105, 76] },
      footStyles: { fillColor: [235, 192, 149], textColor: [45, 36, 24], fontStyle: 'bold' },
    })

    doc.save(`pedido_${pedido.id}.pdf`)
  }

  const exportarWhatsApp = (pedido: Pedido) => {
    const lineas = pedido.items
      .map(
        (item, i) =>
          `${i + 1}. ${item.producto} (${item.medidas}) — ${formatMoney(item.cantidad)} uds × $${formatMoney(item.precioLista)} = *$${formatMoney(item.total)}*`,
      )
      .join('\n')

    const mensaje = `*PEDIDO ${pedido.id}*\n📅 Fecha: ${formatDate(pedido.fecha)}\n👤 Cliente: ${pedido.cliente}\n\n📦 Detalle:\n${lineas}\n\n💰 *Total: $${formatMoney(pedido.total)}*`
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank')
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">Completado</Badge>
      case 'pendiente':
        return <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">Pendiente</Badge>
      case 'cancelado':
        return <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30">Cancelado</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
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
                  {vista === 'lista' ? 'Pedidos' : 'Nuevo Pedido'}
                </h1>
                <p className="text-muted-foreground">
                  {vista === 'lista'
                    ? 'Gestiona los pedidos y controla las salidas de stock'
                    : 'Crea un nuevo pedido seleccionando productos del stock'}
                </p>
              </div>
            </div>
            {vista === 'lista' && (
              <Button onClick={() => setVista('nuevo')} className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Pedido
              </Button>
            )}
          </div>

          {vista === 'lista' ? (
            <Card className="border-border/50 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Pedidos Registrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pedidos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No hay pedidos registrados</p>
                    <p className="text-sm text-muted-foreground/70">
                      Crea un nuevo pedido para empezar
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                          <TableHead className="text-muted-foreground">N° Pedido</TableHead>
                          <TableHead className="text-muted-foreground">Fecha</TableHead>
                          <TableHead className="text-muted-foreground">Cliente</TableHead>
                          <TableHead className="text-right text-muted-foreground">Total</TableHead>
                          <TableHead className="text-muted-foreground">Estado</TableHead>
                          <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pedidos.map((pedido) => (
                          <TableRow key={pedido.id} className="border-border/50">
                            <TableCell className="font-medium text-foreground">{pedido.id}</TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(pedido.fecha)}</TableCell>
                            <TableCell className="text-foreground">{pedido.cliente}</TableCell>
                            <TableCell className="text-right font-medium text-foreground">
                              ${formatMoney(pedido.total)}
                            </TableCell>
                            <TableCell>{getEstadoBadge(pedido.estado)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setPedidoDetalle(pedido)}
                                  className="text-muted-foreground hover:text-primary"
                                  title="Ver detalle"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {!pedido.facturaId ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => router.push(`/facturacion?desde_pedido=${pedido.id}`)}
                                    className="text-muted-foreground hover:text-primary"
                                    title="Generar Factura"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Badge variant="outline" className="ml-1 gap-1 text-[10px]">
                                    <FileText className="h-3 w-3" />
                                    {pedido.facturaId}
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => exportarPDF(pedido)}
                                  className="text-muted-foreground hover:text-primary"
                                  title="Exportar PDF"
                                >
                                  <FileDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => exportarWhatsApp(pedido)}
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
                    <Label htmlFor="cliente">Cliente</Label>
                    <Input
                      id="cliente"
                      value={cliente}
                      onChange={(e) => setCliente(e.target.value)}
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
                          .filter((s) => s.cantidad > 0)
                          .map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.producto} ({s.medidas}) — {formatMoney(s.cantidad)} uds
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {stockSeleccionado && (
                    <p className="text-xs text-muted-foreground">
                      Disponible: <span className="font-medium text-foreground">{formatMoney(stockSeleccionado.cantidad)} uds</span>
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
                      onChange={(e) => setCantidad(e.target.value)}
                      placeholder="0"
                      className="border-border/50 bg-background"
                    />
                  </div>
                  <div className="space-y-2 rounded-lg bg-primary/10 p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm text-muted-foreground">Total línea</span>
                      <span className="text-xl font-bold text-primary">
                        ${stockSeleccionado
                          ? formatMoney((cantidadNum || 1) * stockSeleccionado.precioLista)
                          : '0'}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={agregarItem}
                    className="w-full gap-2"
                    disabled={!stockSeleccionado || cantidadNum <= 0 || cantidadNum > (stockSeleccionado?.cantidad ?? 0)}
                  >
                    <Plus className="h-4 w-4" />
                    Agregar al Pedido
                  </Button>
                </CardContent>
              </Card>

              {/* Detalle del pedido */}
              <Card className="border-border/50 bg-card lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-foreground">Detalle del Pedido</CardTitle>
                  {items.length > 0 && (
                    <Button onClick={confirmarPedido} disabled={!cliente.trim()} className="gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Confirmar Pedido
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No hay productos agregados</p>
                      <p className="text-sm text-muted-foreground/70">
                        Selecciona productos del stock para armar el pedido
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
                            {items.map((item) => (
                              <TableRow key={item.stockItemId} className="border-border/50">
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
                                    onClick={() => eliminarItem(item.stockItemId)}
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
                            <span className="font-medium text-muted-foreground">Total Pedido</span>
                            <span className="text-2xl font-bold text-primary">
                              ${formatMoney(totalPedido)}
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
          <Dialog open={!!pedidoDetalle} onOpenChange={() => setPedidoDetalle(null)}>
            <DialogContent className="max-w-2xl border-border/50 bg-card">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Pedido {pedidoDetalle?.id}
                </DialogTitle>
              </DialogHeader>
              {pedidoDetalle && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Cliente: </span>
                      <span className="font-medium text-foreground">{pedidoDetalle.cliente}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fecha: </span>
                      <span className="font-medium text-foreground">{formatDate(pedidoDetalle.fecha)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Estado: </span>
                      {getEstadoBadge(pedidoDetalle.estado)}
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
                        {pedidoDetalle.items.map((item) => (
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
                    <div className="flex flex-wrap gap-2">
                      {!pedidoDetalle.facturaId ? (
                        <Button
                          onClick={() => {
                            setPedidoDetalle(null)
                            router.push(`/facturacion?desde_pedido=${pedidoDetalle.id}`)
                          }}
                          className="gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Generar Factura
                        </Button>
                      ) : (
                        <Badge variant="outline" className="gap-1 px-3 py-2 text-sm">
                          <FileText className="h-4 w-4" />
                          Facturado: {pedidoDetalle.facturaId}
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => exportarPDF(pedidoDetalle)}
                        className="gap-2"
                      >
                        <FileDown className="h-4 w-4" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => exportarWhatsApp(pedidoDetalle)}
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
                          ${formatMoney(pedidoDetalle.total)}
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
