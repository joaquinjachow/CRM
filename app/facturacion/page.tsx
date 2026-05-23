'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Download, Trash2, Eye, FileText } from 'lucide-react'
import * as XLSX from 'xlsx'

// Productos predefinidos (código 1 al 12 en este orden)
const productosDisponibles = [
  'Pino 1x2',
  'Pino 2x2',
  'Pino 3x3',
  'Pino 3x6',
  'Pino 4x4',
  'Machimbre',
  'Zócalos',
  'Madera Dura',
  'Tirantes',
  'Tablas de Eucalipto',
  'Vigas',
  'Deck',
] as const

const productoPorCodigo = (codigo: number): string | undefined => {
  if (codigo >= 1 && codigo <= productosDisponibles.length) {
    return productosDisponibles[codigo - 1]
  }
  return undefined
}

const codigoPorProducto = (producto: string): number | undefined => {
  const index = productosDisponibles.indexOf(producto as (typeof productosDisponibles)[number])
  return index >= 0 ? index + 1 : undefined
}

const IVA_RATE = 0.21

const calcularTotalesLinea = (cantidadXPaquete: number, precioLista: number) => {
  const totalSinIva = cantidadXPaquete * precioLista
  const iva = totalSinIva * IVA_RATE
  return {
    totalSinIva,
    iva,
    totalConIva: totalSinIva + iva,
  }
}

const formatMoney = (value: number) =>
  value.toLocaleString('es-AR', { maximumFractionDigits: 2 })

interface ItemFacturaLinea {
  codigo: number
  producto: string
  medidas: string
  cantidadXPaquete: number
  precioLista: number
  totalSinIva: number
  totalConIva: number
}

interface FacturaHistorial {
  id: string
  fecha: string
  cliente: string
  items: ItemFacturaLinea[]
  totalSinIva: number
  totalConIva: number
  estado: 'pagada' | 'pendiente' | 'vencida'
}

// Facturas de ejemplo (misma estructura que factura nueva)
const facturasAnteriores: FacturaHistorial[] = [
  {
    id: 'FAC-001',
    fecha: '2025-03-10',
    cliente: 'Maderera San José',
    items: [
      {
        codigo: 2,
        producto: 'Pino 2x2',
        medidas: '1 1/2 x 4',
        cantidadXPaquete: 150,
        precioLista: 2500,
        totalSinIva: 375000,
        totalConIva: 453750,
      },
      {
        codigo: 6,
        producto: 'Machimbre',
        medidas: '1 x 6',
        cantidadXPaquete: 80,
        precioLista: 3200,
        totalSinIva: 256000,
        totalConIva: 309760,
      },
      {
        codigo: 7,
        producto: 'Zócalos',
        medidas: '3/4 x 3',
        cantidadXPaquete: 45,
        precioLista: 1800,
        totalSinIva: 81000,
        totalConIva: 98010,
      },
    ],
    totalSinIva: 712000,
    totalConIva: 861520,
    estado: 'pagada',
  },
  {
    id: 'FAC-002',
    fecha: '2025-03-14',
    cliente: 'Constructora Norte',
    items: [
      {
        codigo: 4,
        producto: 'Pino 3x6',
        medidas: '3 x 6',
        cantidadXPaquete: 200,
        precioLista: 4500,
        totalSinIva: 900000,
        totalConIva: 1089000,
      },
      {
        codigo: 9,
        producto: 'Tirantes',
        medidas: '2 x 8',
        cantidadXPaquete: 120,
        precioLista: 3800,
        totalSinIva: 456000,
        totalConIva: 551760,
      },
    ],
    totalSinIva: 1356000,
    totalConIva: 1640760,
    estado: 'pendiente',
  },
  {
    id: 'FAC-003',
    fecha: '2025-03-18',
    cliente: 'Carpintería López',
    items: [
      {
        codigo: 8,
        producto: 'Madera Dura',
        medidas: '2 x 4',
        cantidadXPaquete: 60,
        precioLista: 8500,
        totalSinIva: 510000,
        totalConIva: 617100,
      },
      {
        codigo: 1,
        producto: 'Pino 1x2',
        medidas: '1 x 2',
        cantidadXPaquete: 100,
        precioLista: 1800,
        totalSinIva: 180000,
        totalConIva: 217800,
      },
      {
        codigo: 12,
        producto: 'Deck',
        medidas: '1 x 4',
        cantidadXPaquete: 35,
        precioLista: 6200,
        totalSinIva: 217000,
        totalConIva: 262570,
      },
    ],
    totalSinIva: 907000,
    totalConIva: 1097470,
    estado: 'pagada',
  },
  {
    id: 'FAC-004',
    fecha: '2025-03-22',
    cliente: 'Muebles Artesanales',
    items: [
      {
        codigo: 5,
        producto: 'Pino 4x4',
        medidas: '4 x 4',
        cantidadXPaquete: 80,
        precioLista: 3600,
        totalSinIva: 288000,
        totalConIva: 348480,
      },
      {
        codigo: 10,
        producto: 'Tablas de Eucalipto',
        medidas: '1 x 8',
        cantidadXPaquete: 50,
        precioLista: 4200,
        totalSinIva: 210000,
        totalConIva: 254100,
      },
    ],
    totalSinIva: 498000,
    totalConIva: 602580,
    estado: 'vencida',
  },
  {
    id: 'FAC-005',
    fecha: '2025-04-02',
    cliente: 'Depósito Central',
    items: [
      {
        codigo: 11,
        producto: 'Vigas',
        medidas: '6 x 8',
        cantidadXPaquete: 40,
        precioLista: 12000,
        totalSinIva: 480000,
        totalConIva: 580800,
      },
      {
        codigo: 3,
        producto: 'Pino 3x3',
        medidas: '3 x 3',
        cantidadXPaquete: 180,
        precioLista: 3200,
        totalSinIva: 576000,
        totalConIva: 696960,
      },
      {
        codigo: 6,
        producto: 'Machimbre',
        medidas: '1 1/2 x 6',
        cantidadXPaquete: 200,
        precioLista: 3200,
        totalSinIva: 640000,
        totalConIva: 774400,
      },
    ],
    totalSinIva: 1696000,
    totalConIva: 2052160,
    estado: 'pagada',
  },
]

interface ItemFactura extends ItemFacturaLinea {
  id: string
}

type Factura = FacturaHistorial

export default function FacturacionPage() {
  const [vista, setVista] = useState<'lista' | 'nueva'>('lista')
  const [items, setItems] = useState<ItemFactura[]>([])
  const [codigo, setCodigo] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState('')
  const [cantidadXPaquete, setCantidadXPaquete] = useState('')
  const [medidas, setMedidas] = useState('')
  const [precioLista, setPrecioLista] = useState('')
  const [facturaDetalle, setFacturaDetalle] = useState<Factura | null>(null)

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

  const limpiarFormulario = () => {
    setCodigo('')
    setProductoSeleccionado('')
    setCantidadXPaquete('')
    setMedidas('')
    setPrecioLista('')
  }

  const agregarItem = () => {
    if (!productoSeleccionado || !cantidadXPaquete || !medidas.trim() || !precioLista) return

    const codigoNum = codigoPorProducto(productoSeleccionado) ?? parseInt(codigo, 10)
    if (!codigoNum || codigoNum < 1 || codigoNum > 12) return

    const { totalSinIva, totalConIva } = calcularTotalesLinea(
      cantidadXPaqueteNum,
      precioListaNum,
    )

    const nuevoItem: ItemFactura = {
      id: Date.now().toString(),
      codigo: codigoNum,
      producto: productoSeleccionado,
      medidas: medidas.trim(),
      cantidadXPaquete: cantidadXPaqueteNum,
      precioLista: precioListaNum,
      totalSinIva,
      totalConIva,
    }

    setItems([...items, nuevoItem])
    limpiarFormulario()
  }

  const eliminarItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const totalFacturaSinIva = items.reduce((sum, item) => sum + item.totalSinIva, 0)
  const totalFacturaConIva = items.reduce((sum, item) => sum + item.totalConIva, 0)
  const totalIvaFactura = totalFacturaConIva - totalFacturaSinIva

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
      { wch: 8 },
      { wch: 22 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
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
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:pl-64">
        <div className="p-4 pt-16 lg:p-8 lg:pt-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {vista === 'nueva' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setVista('lista')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  {vista === 'lista' ? 'Facturación' : 'Nueva Factura'}
                </h1>
                <p className="text-muted-foreground">
                  {vista === 'lista'
                    ? 'Gestiona y consulta tus facturas'
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
            /* Vista de lista de facturas */
            <Card className="border-border/50 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <FileText className="h-5 w-5 text-primary" />
                  Facturas Anteriores
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
                        <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facturasAnteriores.map((factura) => (
                        <TableRow key={factura.id} className="border-border/50">
                          <TableCell className="font-medium text-foreground">
                            {factura.id}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(factura.fecha).toLocaleDateString('es-AR')}
                          </TableCell>
                          <TableCell className="text-foreground">{factura.cliente}</TableCell>
                          <TableCell className="text-right font-medium text-foreground">
                            ${formatMoney(factura.totalConIva)}
                          </TableCell>
                          <TableCell>{getEstadoBadge(factura.estado)}</TableCell>
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
            /* Vista de nueva factura */
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Formulario para agregar items */}
              <Card className="border-border/50 bg-card lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-foreground">Agregar Producto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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

              {/* Tabla de items de la factura */}
              <Card className="border-border/50 bg-card lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-foreground">Detalle de Factura</CardTitle>
                  {items.length > 0 && (
                    <Button onClick={exportarExcel} variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Exportar Excel
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        No hay productos agregados
                      </p>
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

          {/* Modal de detalle de factura */}
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
                        {new Date(facturaDetalle.fecha).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Estado: </span>
                      {getEstadoBadge(facturaDetalle.estado)}
                    </div>
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
        </div>
      </main>
    </div>
  )
}
