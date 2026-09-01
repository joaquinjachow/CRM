import 'server-only'
import { randomUUID } from 'node:crypto'
import { getReminderState, type CashMovement, type ChequeRecord, type EquipmentAsset, type EquipmentReminder, type MonthlyPayment, type MonthlyPaymentNotice } from './business-data'
import { hasCompanyPermission, type CompanyMember, type CompanyPermission } from './company'
import { getSupabaseAdmin } from './supabase'
import type { CrmMutationResult, CrmState } from './crm-state'
import type { Factura, IngresoItem, ItemFacturaLinea, PedidoItem, StockItem } from './stock-data'

export type MutationInput =
  | { action: 'crearPedido'; cliente: string; items: Omit<PedidoItem, 'id'>[] }
  | { action: 'crearPresupuesto'; cliente: string; items: Omit<PedidoItem, 'id'>[] }
  | { action: 'crearIngreso'; proveedor: string; items: Omit<IngresoItem, 'id'>[] }
  | { action: 'crearFactura'; cliente: string; items: ItemFacturaLinea[]; desdePedidoId?: string }
  | { action: 'cancelarPedido'; id: string }
  | { action: 'actualizarFacturaEstado'; id: string; estado: Factura['estado'] }
  | { action: 'agregarEquipo'; asset: Omit<EquipmentAsset, 'id'> }
  | { action: 'agregarRecordatorio'; reminder: Omit<EquipmentReminder, 'id' | 'estado'> }
  | { action: 'actualizarCajaInicial'; saldo: number }
  | { action: 'agregarMovimientoCaja'; movement: Omit<CashMovement, 'id'> }
  | { action: 'agregarCheque'; cheque: Omit<ChequeRecord, 'id' | 'fechaCreacion'> }
  | { action: 'actualizarCheque'; id: string; patch: Partial<Omit<ChequeRecord, 'id' | 'fechaCreacion'>> }
  | { action: 'agregarAvisoPagoMensual'; notice: Omit<MonthlyPaymentNotice, 'id'> }
  | { action: 'marcarAvisoPagoMensualPagado'; avisoId: string; periodo: string; monto: number }

const mutationPermissions: Record<MutationInput['action'], CompanyPermission> = {
  crearPedido: 'orders:write',
  crearPresupuesto: 'quotes:write',
  crearIngreso: 'stock:write',
  crearFactura: 'billing:write',
  cancelarPedido: 'orders:write',
  actualizarFacturaEstado: 'billing:write',
  agregarEquipo: 'equipment:write',
  agregarRecordatorio: 'equipment:write',
  actualizarCajaInicial: 'finance:write',
  agregarMovimientoCaja: 'finance:write',
  agregarCheque: 'finance:write',
  actualizarCheque: 'finance:write',
  agregarAvisoPagoMensual: 'finance:write',
  marcarAvisoPagoMensualPagado: 'finance:write',
}

const emptyState = (): CrmState => ({
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
})

export class CrmRepositoryError extends Error {}

function dateToday() {
  return new Date().toISOString().slice(0, 10)
}

function nextDocumentId(records: { id: string }[], prefix: string) {
  const expression = new RegExp(`^${prefix}-(\\d+)$`)
  const last = records.reduce((current, record) => {
    const match = record.id.match(expression)
    return match ? Math.max(current, Number(match[1])) : current
  }, 0)
  return `${prefix}-${String(last + 1).padStart(3, '0')}`
}

function normalizeCrmState(value: unknown): CrmState {
  const state = value && typeof value === 'object' ? value as Partial<CrmState> : {}
  return {
    stock: Array.isArray(state.stock) ? state.stock : [],
    pedidos: Array.isArray(state.pedidos) ? state.pedidos : [],
    presupuestos: Array.isArray(state.presupuestos) ? state.presupuestos : [],
    ingresos: Array.isArray(state.ingresos) ? state.ingresos : [],
    facturas: Array.isArray(state.facturas) ? state.facturas : [],
    equipment: Array.isArray(state.equipment) ? state.equipment : [],
    reminders: Array.isArray(state.reminders) ? state.reminders : [],
    cashOpeningBalance: typeof state.cashOpeningBalance === 'number' ? state.cashOpeningBalance : 0,
    cashMovements: Array.isArray(state.cashMovements) ? state.cashMovements : [],
    cheques: Array.isArray(state.cheques) ? state.cheques : [],
    monthlyPaymentNotices: Array.isArray(state.monthlyPaymentNotices) ? state.monthlyPaymentNotices : [],
    monthlyPayments: Array.isArray(state.monthlyPayments) ? state.monthlyPayments : [],
  }
}

export async function getCrmState(companyId: string): Promise<CrmState> {
  const { data, error } = await getSupabaseAdmin()
    .from('company_crm_state')
    .select('state')
    .eq('company_id', companyId)
    .maybeSingle()
  if (error) throw new Error(`No se pudo leer el estado del CRM: ${error.message}`)
  return data ? normalizeCrmState(data.state) : emptyState()
}

async function saveCrmState(companyId: string, state: CrmState) {
  const { error } = await getSupabaseAdmin()
    .from('company_crm_state')
    .upsert({ company_id: companyId, state, updated_at: new Date().toISOString() }, { onConflict: 'company_id' })
  if (error) throw new Error(`No se pudo guardar el estado del CRM: ${error.message}`)
}

export function getMutationRequiredPermission(input: unknown): CompanyPermission {
  if (!input || typeof input !== 'object' || !('action' in input) || typeof input.action !== 'string') {
    throw new CrmRepositoryError('La operación indicada no es válida.')
  }
  const permission = mutationPermissions[input.action as MutationInput['action']]
  if (!permission) throw new CrmRepositoryError('La operación indicada no es válida.')
  return permission
}

export function getVisibleCrmState(state: CrmState, member: CompanyMember): CrmState {
  const can = (permission: CompanyPermission) => hasCompanyPermission(member, permission)
  const canSeeStock = can('stock:view') || can('orders:view') || can('quotes:view')
  const canSeeOrders = can('orders:view') || can('billing:view')
  const canSeeInvoices = can('billing:view') || can('orders:view')

  return {
    stock: canSeeStock ? state.stock : [],
    pedidos: canSeeOrders ? state.pedidos : [],
    presupuestos: can('quotes:view') ? state.presupuestos : [],
    ingresos: can('stock:view') ? state.ingresos : [],
    facturas: canSeeInvoices ? state.facturas : [],
    equipment: can('equipment:view') ? state.equipment : [],
    reminders: can('equipment:view') ? state.reminders : [],
    cashOpeningBalance: can('finance:view') ? state.cashOpeningBalance : 0,
    cashMovements: can('finance:view') ? state.cashMovements : [],
    cheques: can('finance:view') ? state.cheques : [],
    monthlyPaymentNotices: can('finance:view') ? state.monthlyPaymentNotices : [],
    monthlyPayments: can('finance:view') ? state.monthlyPayments : [],
  }
}

function findStockOrThrow(stock: StockItem[], stockItemId: string) {
  const stockItem = stock.find((item) => item.id === stockItemId)
  if (!stockItem) throw new CrmRepositoryError('El producto ya no está disponible en el stock.')
  return stockItem
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return new Date(`${value}T00:00:00`).toISOString().slice(0, 10) === value
}

export async function mutateCrmState(companyId: string, input: MutationInput): Promise<CrmMutationResult> {
  const state = await getCrmState(companyId)
  let createdId: string | undefined

  switch (input.action) {
    case 'crearPedido': {
      if (!input.cliente.trim() || input.items.length === 0) throw new CrmRepositoryError('Completá cliente y productos del pedido.')
      for (const item of input.items) {
        const stockItem = findStockOrThrow(state.stock, item.stockItemId)
        if (stockItem.cantidad < item.cantidad) throw new CrmRepositoryError(`Stock insuficiente para ${stockItem.producto}.`)
      }
      const id = nextDocumentId(state.pedidos, 'PED')
      const pedido = {
        id,
        fecha: dateToday(),
        cliente: input.cliente.trim(),
        items: input.items.map((item) => ({ ...item, id: randomUUID() })),
        total: input.items.reduce((sum, item) => sum + item.total, 0),
        estado: 'pendiente' as const,
      }
      state.stock = state.stock.map((stockItem) => {
        const item = input.items.find((entry) => entry.stockItemId === stockItem.id)
        return item ? { ...stockItem, cantidad: stockItem.cantidad - item.cantidad } : stockItem
      })
      state.pedidos.unshift(pedido)
      createdId = id
      break
    }
    case 'crearPresupuesto': {
      if (!input.cliente.trim() || input.items.length === 0) throw new CrmRepositoryError('Completá cliente y productos del presupuesto.')
      for (const item of input.items) {
        const stockItem = findStockOrThrow(state.stock, item.stockItemId)
        if (stockItem.cantidad < item.cantidad) throw new CrmRepositoryError(`Stock insuficiente para ${stockItem.producto}.`)
      }
      const id = nextDocumentId(state.presupuestos, 'PRE')
      state.presupuestos.unshift({
        id,
        fecha: dateToday(),
        cliente: input.cliente.trim(),
        items: input.items.map((item) => ({ ...item, id: randomUUID() })),
        total: input.items.reduce((sum, item) => sum + item.total, 0),
      })
      createdId = id
      break
    }
    case 'crearIngreso': {
      if (!input.proveedor.trim() || input.items.length === 0) throw new CrmRepositoryError('Completá proveedor y productos del ingreso.')
      const id = nextDocumentId(state.ingresos, 'ING')
      state.ingresos.unshift({
        id,
        fecha: dateToday(),
        proveedor: input.proveedor.trim(),
        items: input.items.map((item) => ({ ...item, id: randomUUID() })),
        total: input.items.reduce((sum, item) => sum + item.total, 0),
      })
      for (const item of input.items) {
        const stockIndex = state.stock.findIndex((stockItem) => stockItem.producto === item.producto && stockItem.medidas === item.medidas)
        if (stockIndex >= 0) {
          const stockItem = state.stock[stockIndex]
          state.stock[stockIndex] = { ...stockItem, cantidad: stockItem.cantidad + item.cantidad, precioLista: item.precioLista }
        } else {
          state.stock.push({
            id: `stk-${randomUUID()}`,
            codigo: item.codigo,
            producto: item.producto,
            medidas: item.medidas,
            tipo: 'pino',
            cantidad: item.cantidad,
            precioLista: item.precioLista,
          })
        }
      }
      createdId = id
      break
    }
    case 'crearFactura': {
      if (!input.cliente.trim() || input.items.length === 0) throw new CrmRepositoryError('Completá cliente y productos de la factura.')
      const id = nextDocumentId(state.facturas, 'FAC')
      const totalSinIva = input.items.reduce((sum, item) => sum + item.totalSinIva, 0)
      const totalConIva = input.items.reduce((sum, item) => sum + item.totalConIva, 0)
      state.facturas.unshift({
        id,
        fecha: dateToday(),
        cliente: input.cliente.trim(),
        items: input.items,
        totalSinIva,
        totalConIva,
        estado: 'pendiente',
        desdePedidoId: input.desdePedidoId,
      })
      if (input.desdePedidoId) {
        state.pedidos = state.pedidos.map((pedido) => (
          pedido.id === input.desdePedidoId ? { ...pedido, estado: 'completado', facturaId: id } : pedido
        ))
      }
      createdId = id
      break
    }
    case 'cancelarPedido': {
      const pedido = state.pedidos.find((item) => item.id === input.id)
      if (!pedido || pedido.estado !== 'pendiente') throw new CrmRepositoryError('El pedido no se puede cancelar.')
      state.stock = state.stock.map((stockItem) => {
        const item = pedido.items.find((entry) => entry.stockItemId === stockItem.id)
        return item ? { ...stockItem, cantidad: stockItem.cantidad + item.cantidad } : stockItem
      })
      state.pedidos = state.pedidos.map((item) => (item.id === input.id ? { ...item, estado: 'cancelado' } : item))
      break
    }
    case 'actualizarFacturaEstado': {
      const found = state.facturas.some((item) => item.id === input.id)
      if (!found) throw new CrmRepositoryError('La factura indicada no existe.')
      state.facturas = state.facturas.map((item) => (item.id === input.id ? { ...item, estado: input.estado } : item))
      break
    }
    case 'agregarEquipo': {
      const id = `eq-${randomUUID()}`
      state.equipment.unshift({ ...input.asset, id })
      createdId = id
      break
    }
    case 'agregarRecordatorio': {
      if (!state.equipment.some((item) => item.id === input.reminder.assetId)) throw new CrmRepositoryError('El activo indicado no existe.')
      const id = `rem-${randomUUID()}`
      const reminder = { ...input.reminder, id } as EquipmentReminder
      state.reminders.unshift({ ...reminder, estado: getReminderState(reminder).estado })
      createdId = id
      break
    }
    case 'actualizarCajaInicial': {
      state.cashOpeningBalance = input.saldo
      break
    }
    case 'agregarMovimientoCaja': {
      const id = `cash-${randomUUID()}`
      state.cashMovements.unshift({ ...input.movement, id })
      createdId = id
      break
    }
    case 'agregarCheque': {
      const id = `chq-${randomUUID()}`
      state.cheques.unshift({ ...input.cheque, id, fechaCreacion: dateToday() })
      createdId = id
      break
    }
    case 'actualizarCheque': {
      const found = state.cheques.some((item) => item.id === input.id)
      if (!found) throw new CrmRepositoryError('El cheque indicado no existe.')
      state.cheques = state.cheques.map((item) => (item.id === input.id ? { ...item, ...input.patch } : item))
      break
    }
    case 'agregarAvisoPagoMensual': {
      const { titulo, fechaInicio, recordatorioDias, notas } = input.notice
      if (!titulo.trim() || !isIsoDate(fechaInicio)) throw new CrmRepositoryError('Completá el nombre y la fecha del aviso de pago.')
      if (!Number.isInteger(recordatorioDias) || recordatorioDias < 0) throw new CrmRepositoryError('Indicá una cantidad válida de días de aviso.')
      const id = `pay-notice-${randomUUID()}`
      state.monthlyPaymentNotices.unshift({
        id,
        titulo: titulo.trim(),
        fechaInicio,
        recordatorioDias,
        notas: notas?.trim() || undefined,
      })
      createdId = id
      break
    }
    case 'marcarAvisoPagoMensualPagado': {
      const notice = state.monthlyPaymentNotices.find((item) => item.id === input.avisoId)
      if (!notice) throw new CrmRepositoryError('El aviso de pago ya no existe.')
      if (!/^\d{4}-\d{2}$/.test(input.periodo)) throw new CrmRepositoryError('El período de pago no es válido.')
      if (!Number.isFinite(input.monto) || input.monto <= 0) throw new CrmRepositoryError('Indicá un monto de pago válido.')
      if (state.monthlyPayments.some((item) => item.avisoId === input.avisoId && item.periodo === input.periodo)) {
        throw new CrmRepositoryError('Este aviso ya fue marcado como pagado para el período indicado.')
      }
      const fechaPago = dateToday()
      const cashMovementId = `cash-${randomUUID()}`
      const id = `payment-${randomUUID()}`
      state.monthlyPayments.unshift({
        id,
        avisoId: input.avisoId,
        periodo: input.periodo,
        fechaPago,
        monto: input.monto,
        cashMovementId,
      })
      state.cashMovements.unshift({
        id: cashMovementId,
        fecha: fechaPago,
        tipo: 'egreso',
        concepto: `Pago mensual: ${notice.titulo}`,
        categoria: 'Pagos mensuales',
        monto: input.monto,
        notas: `Pago de ${input.periodo} registrado desde avisos mensuales.`,
      })
      createdId = id
      break
    }
  }

  await saveCrmState(companyId, state)
  return { state, createdId }
}
