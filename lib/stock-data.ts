export type TipoMadera = 'pino' | 'molduras' | 'fenolicos' | 'otros'

export interface StockItem {
  id: string
  codigo: number
  producto: string
  medidas: string
  tipo: TipoMadera
  cantidad: number
  precioLista: number
}

export interface PedidoItem {
  id: string
  stockItemId: string
  codigo: number
  producto: string
  medidas: string
  cantidad: number
  precioLista: number
  total: number
}

export interface Pedido {
  id: string
  fecha: string
  cliente: string
  items: PedidoItem[]
  total: number
  estado: 'pendiente' | 'completado' | 'cancelado'
  facturaId?: string
}

export interface Presupuesto {
  id: string
  fecha: string
  cliente: string
  items: PedidoItem[]
  total: number
}

export interface IngresoItem {
  id: string
  codigo: number
  producto: string
  medidas: string
  cantidad: number
  precioLista: number
  total: number
}

export interface IngresoMercaderia {
  id: string
  fecha: string
  proveedor: string
  items: IngresoItem[]
  total: number
}

export const tiposMadera: { value: TipoMadera | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pino', label: 'Pino' },
  { value: 'molduras', label: 'Molduras' },
  { value: 'fenolicos', label: 'Fenólicos' },
  { value: 'otros', label: 'Otros' },
]

export const productosDisponibles = [
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

export const productoPorCodigo = (codigo: number): string | undefined => {
  if (codigo >= 1 && codigo <= productosDisponibles.length) {
    return productosDisponibles[codigo - 1]
  }
  return undefined
}

export const codigoPorProducto = (producto: string): number | undefined => {
  const index = productosDisponibles.indexOf(producto as (typeof productosDisponibles)[number])
  return index >= 0 ? index + 1 : undefined
}

export const stockInicial: StockItem[] = [
  { id: 'stk-01', codigo: 1, producto: 'Pino 1x2', medidas: '1 x 2', tipo: 'pino', cantidad: 500, precioLista: 1800 },
  { id: 'stk-02', codigo: 2, producto: 'Pino 2x2', medidas: '2 x 2', tipo: 'pino', cantidad: 350, precioLista: 2500 },
  { id: 'stk-03', codigo: 2, producto: 'Pino 2x2', medidas: '1 1/2 x 4', tipo: 'pino', cantidad: 200, precioLista: 2500 },
  { id: 'stk-04', codigo: 3, producto: 'Pino 3x3', medidas: '3 x 3', tipo: 'pino', cantidad: 280, precioLista: 3200 },
  { id: 'stk-05', codigo: 4, producto: 'Pino 3x6', medidas: '3 x 6', tipo: 'pino', cantidad: 150, precioLista: 4500 },
  { id: 'stk-06', codigo: 5, producto: 'Pino 4x4', medidas: '4 x 4', tipo: 'pino', cantidad: 120, precioLista: 3600 },
  { id: 'stk-07', codigo: 6, producto: 'Machimbre', medidas: '1 x 6', tipo: 'pino', cantidad: 400, precioLista: 3200 },
  { id: 'stk-08', codigo: 6, producto: 'Machimbre', medidas: '1 1/2 x 6', tipo: 'pino', cantidad: 300, precioLista: 3200 },
  { id: 'stk-09', codigo: 7, producto: 'Zócalos', medidas: '3/4 x 3', tipo: 'pino', cantidad: 250, precioLista: 1800 },
  { id: 'stk-10', codigo: 8, producto: 'Madera Dura', medidas: '2 x 4', tipo: 'pino', cantidad: 100, precioLista: 8500 },
  { id: 'stk-11', codigo: 8, producto: 'Madera Dura', medidas: '2 x 6', tipo: 'pino', cantidad: 80, precioLista: 9200 },
  { id: 'stk-12', codigo: 9, producto: 'Tirantes', medidas: '2 x 8', tipo: 'pino', cantidad: 180, precioLista: 3800 },
  { id: 'stk-13', codigo: 9, producto: 'Tirantes', medidas: '2 x 6', tipo: 'pino', cantidad: 220, precioLista: 3400 },
  { id: 'stk-14', codigo: 10, producto: 'Tablas de Eucalipto', medidas: '1 x 8', tipo: 'pino', cantidad: 90, precioLista: 4200 },
  { id: 'stk-15', codigo: 11, producto: 'Vigas', medidas: '6 x 8', tipo: 'pino', cantidad: 60, precioLista: 12000 },
  { id: 'stk-16', codigo: 11, producto: 'Vigas', medidas: '4 x 8', tipo: 'pino', cantidad: 45, precioLista: 9500 },
  { id: 'stk-17', codigo: 12, producto: 'Deck', medidas: '1 x 4', tipo: 'pino', cantidad: 75, precioLista: 6200 },
  { id: 'stk-18', codigo: 12, producto: 'Deck', medidas: '1 x 6', tipo: 'pino', cantidad: 50, precioLista: 7000 },
]

export const IVA_RATE = 0.21

export interface ItemFacturaLinea {
  codigo: number
  producto: string
  medidas: string
  cantidadXPaquete: number
  precioLista: number
  totalSinIva: number
  totalConIva: number
}

export interface Factura {
  id: string
  fecha: string
  cliente: string
  items: ItemFacturaLinea[]
  totalSinIva: number
  totalConIva: number
  estado: 'pagada' | 'pendiente' | 'vencida'
  desdePedidoId?: string
}

export const facturasIniciales: Factura[] = [
  {
    id: 'FAC-001',
    fecha: '2025-03-10',
    cliente: 'Maderera San José',
    items: [
      { codigo: 2, producto: 'Pino 2x2', medidas: '1 1/2 x 4', cantidadXPaquete: 150, precioLista: 2500, totalSinIva: 375000, totalConIva: 453750 },
      { codigo: 6, producto: 'Machimbre', medidas: '1 x 6', cantidadXPaquete: 80, precioLista: 3200, totalSinIva: 256000, totalConIva: 309760 },
      { codigo: 7, producto: 'Zócalos', medidas: '3/4 x 3', cantidadXPaquete: 45, precioLista: 1800, totalSinIva: 81000, totalConIva: 98010 },
    ],
    totalSinIva: 712000, totalConIva: 861520, estado: 'pagada',
  },
  {
    id: 'FAC-002',
    fecha: '2025-03-14',
    cliente: 'Constructora Norte',
    items: [
      { codigo: 4, producto: 'Pino 3x6', medidas: '3 x 6', cantidadXPaquete: 200, precioLista: 4500, totalSinIva: 900000, totalConIva: 1089000 },
      { codigo: 9, producto: 'Tirantes', medidas: '2 x 8', cantidadXPaquete: 120, precioLista: 3800, totalSinIva: 456000, totalConIva: 551760 },
    ],
    totalSinIva: 1356000, totalConIva: 1640760, estado: 'pendiente',
  },
  {
    id: 'FAC-003',
    fecha: '2025-03-18',
    cliente: 'Carpintería López',
    items: [
      { codigo: 8, producto: 'Madera Dura', medidas: '2 x 4', cantidadXPaquete: 60, precioLista: 8500, totalSinIva: 510000, totalConIva: 617100 },
      { codigo: 1, producto: 'Pino 1x2', medidas: '1 x 2', cantidadXPaquete: 100, precioLista: 1800, totalSinIva: 180000, totalConIva: 217800 },
      { codigo: 12, producto: 'Deck', medidas: '1 x 4', cantidadXPaquete: 35, precioLista: 6200, totalSinIva: 217000, totalConIva: 262570 },
    ],
    totalSinIva: 907000, totalConIva: 1097470, estado: 'pagada',
  },
  {
    id: 'FAC-004',
    fecha: '2025-03-22',
    cliente: 'Muebles Artesanales',
    items: [
      { codigo: 5, producto: 'Pino 4x4', medidas: '4 x 4', cantidadXPaquete: 80, precioLista: 3600, totalSinIva: 288000, totalConIva: 348480 },
      { codigo: 10, producto: 'Tablas de Eucalipto', medidas: '1 x 8', cantidadXPaquete: 50, precioLista: 4200, totalSinIva: 210000, totalConIva: 254100 },
    ],
    totalSinIva: 498000, totalConIva: 602580, estado: 'vencida',
  },
  {
    id: 'FAC-005',
    fecha: '2025-04-02',
    cliente: 'Depósito Central',
    items: [
      { codigo: 11, producto: 'Vigas', medidas: '6 x 8', cantidadXPaquete: 40, precioLista: 12000, totalSinIva: 480000, totalConIva: 580800 },
      { codigo: 3, producto: 'Pino 3x3', medidas: '3 x 3', cantidadXPaquete: 180, precioLista: 3200, totalSinIva: 576000, totalConIva: 696960 },
      { codigo: 6, producto: 'Machimbre', medidas: '1 1/2 x 6', cantidadXPaquete: 200, precioLista: 3200, totalSinIva: 640000, totalConIva: 774400 },
    ],
    totalSinIva: 1696000, totalConIva: 2052160, estado: 'pagada',
  },
]

export const calcularTotalesLinea = (cantidadXPaquete: number, precioLista: number) => {
  const totalSinIva = cantidadXPaquete * precioLista
  const iva = totalSinIva * IVA_RATE
  return { totalSinIva, iva, totalConIva: totalSinIva + iva }
}

export const formatMoney = (value: number) =>
  value.toLocaleString('es-AR', { maximumFractionDigits: 2 })

export const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('es-AR')