'use client'
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  type StockItem,
  type Pedido,
  type PedidoItem,
  type IngresoMercaderia,
  type IngresoItem,
  type Factura,
  type ItemFacturaLinea,
  stockInicial,
  facturasIniciales,
} from './stock-data'

interface StockContextType {
  stock: StockItem[]
  pedidos: Pedido[]
  ingresos: IngresoMercaderia[]
  facturas: Factura[]
  crearPedido: (cliente: string, items: Omit<PedidoItem, 'id'>[]) => Pedido | null
  crearIngreso: (proveedor: string, items: Omit<IngresoItem, 'id'>[]) => IngresoMercaderia
  crearFactura: (cliente: string, items: ItemFacturaLinea[], desdePedidoId?: string) => Factura
  obtenerPedido: (id: string) => Pedido | undefined
}

const StockContext = createContext<StockContextType | null>(null)

const STORAGE_KEYS = {
  stock: 'crm-stock',
  pedidos: 'crm-pedidos',
  ingresos: 'crm-ingresos',
  facturas: 'crm-facturas',
} as const

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* quota exceeded */ }
}

export function StockProvider({ children }: { children: ReactNode }) {
  const [stock, setStock] = useState<StockItem[]>(stockInicial)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [ingresos, setIngresos] = useState<IngresoMercaderia[]>([])
  const [facturas, setFacturas] = useState<Factura[]>(facturasIniciales)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setStock(loadFromStorage(STORAGE_KEYS.stock, stockInicial))
    setPedidos(loadFromStorage(STORAGE_KEYS.pedidos, []))
    setIngresos(loadFromStorage(STORAGE_KEYS.ingresos, []))
    setFacturas(loadFromStorage(STORAGE_KEYS.facturas, facturasIniciales))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveToStorage(STORAGE_KEYS.stock, stock)
  }, [stock, hydrated])

  useEffect(() => {
    if (!hydrated) return
    saveToStorage(STORAGE_KEYS.pedidos, pedidos)
  }, [pedidos, hydrated])

  useEffect(() => {
    if (!hydrated) return
    saveToStorage(STORAGE_KEYS.ingresos, ingresos)
  }, [ingresos, hydrated])

  useEffect(() => {
    if (!hydrated) return
    saveToStorage(STORAGE_KEYS.facturas, facturas)
  }, [facturas, hydrated])

  const crearPedido = useCallback(
    (cliente: string, items: Omit<PedidoItem, 'id'>[]): Pedido | null => {
      for (const item of items) {
        const stockItem = stock.find((s) => s.id === item.stockItemId)
        if (!stockItem || stockItem.cantidad < item.cantidad) return null
      }

      const pedido: Pedido = {
        id: `PED-${String(pedidos.length + 1).padStart(3, '0')}`,
        fecha: new Date().toISOString().split('T')[0],
        cliente,
        items: items.map((item) => ({ ...item, id: crypto.randomUUID() })),
        total: items.reduce((sum, i) => sum + i.total, 0),
        estado: 'pendiente',
      }

      setStock((prev) =>
        prev.map((s) => {
          const match = items.find((i) => i.stockItemId === s.id)
          return match ? { ...s, cantidad: s.cantidad - match.cantidad } : s
        }),
      )
      setPedidos((prev) => [pedido, ...prev])
      return pedido
    },
    [stock, pedidos.length],
  )

  const crearIngreso = useCallback(
    (proveedor: string, items: Omit<IngresoItem, 'id'>[]): IngresoMercaderia => {
      const ingreso: IngresoMercaderia = {
        id: `ING-${String(ingresos.length + 1).padStart(3, '0')}`,
        fecha: new Date().toISOString().split('T')[0],
        proveedor,
        items: items.map((item) => ({ ...item, id: crypto.randomUUID() })),
        total: items.reduce((sum, i) => sum + i.total, 0),
      }

      setStock((prev) => {
        const updated = [...prev]
        for (const item of items) {
          const idx = updated.findIndex(
            (s) => s.producto === item.producto && s.medidas === item.medidas,
          )
          if (idx >= 0) {
            updated[idx] = {
              ...updated[idx],
              cantidad: updated[idx].cantidad + item.cantidad,
              precioLista: item.precioLista,
            }
          } else {
            updated.push({
              id: `stk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              codigo: item.codigo,
              producto: item.producto,
              medidas: item.medidas,
              tipo: 'pino',
              cantidad: item.cantidad,
              precioLista: item.precioLista,
            })
          }
        }
        return updated
      })
      setIngresos((prev) => [ingreso, ...prev])
      return ingreso
    },
    [ingresos.length],
  )

  const crearFactura = useCallback(
    (cliente: string, items: ItemFacturaLinea[], desdePedidoId?: string): Factura => {
      const totalSinIva = items.reduce((sum, i) => sum + i.totalSinIva, 0)
      const totalConIva = items.reduce((sum, i) => sum + i.totalConIva, 0)

      const factura: Factura = {
        id: `FAC-${String(facturas.length + 1).padStart(3, '0')}`,
        fecha: new Date().toISOString().split('T')[0],
        cliente,
        items,
        totalSinIva,
        totalConIva,
        estado: 'pendiente',
        desdePedidoId,
      }

      setFacturas((prev) => [factura, ...prev])

      if (desdePedidoId) {
        setPedidos((prev) =>
          prev.map((p) =>
            p.id === desdePedidoId
              ? { ...p, estado: 'completado' as const, facturaId: factura.id }
              : p,
          ),
        )
      }

      return factura
    },
    [facturas.length],
  )

  const obtenerPedido = useCallback(
    (id: string) => pedidos.find((p) => p.id === id),
    [pedidos],
  )

  return (
    <StockContext.Provider
      value={{ stock, pedidos, ingresos, facturas, crearPedido, crearIngreso, crearFactura, obtenerPedido }}
    >
      {children}
    </StockContext.Provider>
  )
}

export function useStock() {
  const ctx = useContext(StockContext)
  if (!ctx) throw new Error('useStock must be used inside StockProvider')
  return ctx
}
