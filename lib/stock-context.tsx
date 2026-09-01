'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { type CompanyPermission } from './company'
import { useCompany } from './company-context'
import { type StockItem, type Pedido, type PedidoItem, type Presupuesto, type IngresoMercaderia, type IngresoItem, type Factura, type ItemFacturaLinea } from './stock-data'
import { type EquipmentAsset, type EquipmentReminder, type CashMovement, type ChequeRecord, type MonthlyPayment, type MonthlyPaymentNotice, buildReminderPreviews, buildMonthlyPaymentPreviews, getMonthlyPaymentAlerts, type ReminderPreview, type MonthlyPaymentPreview } from './business-data'
import type { CrmMutationResult, CrmState } from './crm-state'

interface StockContextType extends CrmState {
  upcomingReminders: ReminderPreview[]
  monthlyPaymentPreviews: MonthlyPaymentPreview[]
  upcomingMonthlyPaymentAlerts: MonthlyPaymentPreview[]
  crearPedido: (cliente: string, items: Omit<PedidoItem, 'id'>[]) => Promise<Pedido | null>
  crearPresupuesto: (cliente: string, items: Omit<PedidoItem, 'id'>[]) => Promise<Presupuesto | null>
  crearIngreso: (proveedor: string, items: Omit<IngresoItem, 'id'>[]) => Promise<IngresoMercaderia | null>
  crearFactura: (cliente: string, items: ItemFacturaLinea[], desdePedidoId?: string) => Promise<Factura | null>
  obtenerPedido: (id: string) => Pedido | undefined
  obtenerFactura: (id: string) => Factura | undefined
  cancelarPedido: (id: string) => Promise<boolean>
  actualizarFacturaEstado: (id: string, estado: Factura['estado']) => Promise<void>
  agregarEquipo: (asset: Omit<EquipmentAsset, 'id'>) => Promise<EquipmentAsset | null>
  agregarRecordatorio: (reminder: Omit<EquipmentReminder, 'id' | 'estado'>) => Promise<EquipmentReminder | null>
  actualizarCajaInicial: (saldo: number) => Promise<void>
  agregarMovimientoCaja: (movement: Omit<CashMovement, 'id'>) => Promise<CashMovement | null>
  agregarCheque: (cheque: Omit<ChequeRecord, 'id' | 'fechaCreacion'>) => Promise<ChequeRecord | null>
  actualizarCheque: (id: string, patch: Partial<Omit<ChequeRecord, 'id' | 'fechaCreacion'>>) => Promise<void>
  agregarAvisoPagoMensual: (notice: Omit<MonthlyPaymentNotice, 'id'>) => Promise<MonthlyPaymentNotice | null>
  marcarAvisoPagoMensualPagado: (avisoId: string, periodo: string, monto: number) => Promise<MonthlyPayment | null>
}

const StockContext = createContext<StockContextType | null>(null)

const emptyState: CrmState = {
  stock: [],
  pedidos: [],
  presupuestos: [],
  ingresos: [],
  facturas: [],
  equipment: [],
  reminders: [],
  cashOpeningBalance: 0,
  cashMovements: [],
  cheques: [],
  monthlyPaymentNotices: [],
  monthlyPayments: [],
}

function resourceForPath(pathname: string): { resource: string; permission: CompanyPermission } | null {
  if (pathname === '/') return { resource: 'dashboard', permission: 'dashboard:view' }
  if (pathname === '/calcular-flete') return { resource: 'freight', permission: 'freight:view' }
  if (pathname === '/stock' || pathname === '/ingreso-mercaderia') return { resource: 'stock', permission: 'stock:view' }
  if (pathname === '/presupuestos') return { resource: 'quotes', permission: 'quotes:view' }
  if (pathname === '/pedidos') return { resource: 'orders', permission: 'orders:view' }
  if (pathname === '/facturacion') return { resource: 'billing', permission: 'billing:view' }
  if (pathname === '/equipamiento') return { resource: 'equipment', permission: 'equipment:view' }
  if (pathname === '/finanzas') return { resource: 'finance', permission: 'finance:view' }
  return null
}

export function StockProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const routeAccess = useMemo(() => resourceForPath(pathname), [pathname])
  const { can, loading: companyLoading } = useCompany()
  const [state, setState] = useState<CrmState>(emptyState)

  const loadState = useCallback(async () => {
    try {
      if (!routeAccess) {
        setState(emptyState)
        return
      }
      const response = await fetch(`/api/crm?resource=${routeAccess.resource}`, { cache: 'no-store' })
      const body = await response.json() as { state?: CrmState; error?: string }
      if (!response.ok || !body.state) throw new Error(body.error || 'No se pudo cargar la base de datos.')
      setState(body.state)
    } catch (error) {
      console.error(error)
    }
  }, [routeAccess])

  useEffect(() => {
    if (companyLoading) return
    if (!routeAccess || !can(routeAccess.permission)) {
      setState(emptyState)
      return
    }
    void loadState()
  }, [can, companyLoading, loadState, routeAccess])

  const runMutation = useCallback(async (payload: Record<string, unknown>): Promise<CrmMutationResult | null> => {
    try {
      const response = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(body?.error ?? 'No se pudo guardar el cambio.')
      }
      const result = await response.json() as CrmMutationResult
      setState(result.state)
      return result
    } catch (error) {
      console.error(error)
      return null
    }
  }, [])

  const crearPedido = useCallback(async (cliente: string, items: Omit<PedidoItem, 'id'>[]) => {
    const result = await runMutation({ action: 'crearPedido', cliente, items })
    return result?.state.pedidos.find((item) => item.id === result.createdId) ?? null
  }, [runMutation])

  const crearPresupuesto = useCallback(async (cliente: string, items: Omit<PedidoItem, 'id'>[]) => {
    const result = await runMutation({ action: 'crearPresupuesto', cliente, items })
    return result?.state.presupuestos.find((item) => item.id === result.createdId) ?? null
  }, [runMutation])

  const crearIngreso = useCallback(async (proveedor: string, items: Omit<IngresoItem, 'id'>[]) => {
    const result = await runMutation({ action: 'crearIngreso', proveedor, items })
    return result?.state.ingresos.find((item) => item.id === result.createdId) ?? null
  }, [runMutation])

  const crearFactura = useCallback(async (cliente: string, items: ItemFacturaLinea[], desdePedidoId?: string) => {
    const result = await runMutation({ action: 'crearFactura', cliente, items, desdePedidoId })
    return result?.state.facturas.find((item) => item.id === result.createdId) ?? null
  }, [runMutation])

  const obtenerPedido = useCallback((id: string) => state.pedidos.find((item) => item.id === id), [state.pedidos])
  const obtenerFactura = useCallback((id: string) => state.facturas.find((item) => item.id === id), [state.facturas])

  const cancelarPedido = useCallback(async (id: string) => {
    const result = await runMutation({ action: 'cancelarPedido', id })
    return result !== null
  }, [runMutation])

  const actualizarFacturaEstado = useCallback(async (id: string, estado: Factura['estado']) => {
    await runMutation({ action: 'actualizarFacturaEstado', id, estado })
  }, [runMutation])

  const agregarEquipo = useCallback(async (asset: Omit<EquipmentAsset, 'id'>) => {
    const result = await runMutation({ action: 'agregarEquipo', asset })
    return result?.state.equipment.find((item) => item.id === result.createdId) ?? null
  }, [runMutation])

  const agregarRecordatorio = useCallback(async (reminder: Omit<EquipmentReminder, 'id' | 'estado'>) => {
    const result = await runMutation({ action: 'agregarRecordatorio', reminder })
    return result?.state.reminders.find((item) => item.id === result.createdId) ?? null
  }, [runMutation])

  const actualizarCajaInicial = useCallback(async (saldo: number) => {
    await runMutation({ action: 'actualizarCajaInicial', saldo })
  }, [runMutation])

  const agregarMovimientoCaja = useCallback(async (movement: Omit<CashMovement, 'id'>) => {
    const result = await runMutation({ action: 'agregarMovimientoCaja', movement })
    return result?.state.cashMovements.find((item) => item.id === result.createdId) ?? null
  }, [runMutation])

  const agregarCheque = useCallback(async (cheque: Omit<ChequeRecord, 'id' | 'fechaCreacion'>) => {
    const result = await runMutation({ action: 'agregarCheque', cheque })
    return result?.state.cheques.find((item) => item.id === result.createdId) ?? null
  }, [runMutation])

  const actualizarCheque = useCallback(async (id: string, patch: Partial<Omit<ChequeRecord, 'id' | 'fechaCreacion'>>) => {
    await runMutation({ action: 'actualizarCheque', id, patch })
  }, [runMutation])

  const agregarAvisoPagoMensual = useCallback(async (notice: Omit<MonthlyPaymentNotice, 'id'>) => {
    const result = await runMutation({ action: 'agregarAvisoPagoMensual', notice })
    return result?.state.monthlyPaymentNotices.find((item) => item.id === result.createdId) ?? null
  }, [runMutation])

  const marcarAvisoPagoMensualPagado = useCallback(async (avisoId: string, periodo: string, monto: number) => {
    const result = await runMutation({ action: 'marcarAvisoPagoMensualPagado', avisoId, periodo, monto })
    return result?.state.monthlyPayments.find((item) => item.id === result.createdId) ?? null
  }, [runMutation])

  const upcomingReminders = buildReminderPreviews(state.reminders, state.equipment)
  const monthlyPaymentPreviews = buildMonthlyPaymentPreviews(state.monthlyPaymentNotices, state.monthlyPayments)
  const upcomingMonthlyPaymentAlerts = getMonthlyPaymentAlerts(monthlyPaymentPreviews)

  return (
    <StockContext.Provider
      value={{
        ...state,
        upcomingReminders,
        monthlyPaymentPreviews,
        upcomingMonthlyPaymentAlerts,
        crearPedido,
        crearPresupuesto,
        crearIngreso,
        crearFactura,
        obtenerPedido,
        obtenerFactura,
        cancelarPedido,
        actualizarFacturaEstado,
        agregarEquipo,
        agregarRecordatorio,
        actualizarCajaInicial,
        agregarMovimientoCaja,
        agregarCheque,
        actualizarCheque,
        agregarAvisoPagoMensual,
        marcarAvisoPagoMensualPagado,
      }}
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
