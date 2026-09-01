import type { Factura, IngresoMercaderia, Pedido, Presupuesto, StockItem } from './stock-data'
import type { CashMovement, ChequeRecord, EquipmentAsset, EquipmentReminder, MonthlyPayment, MonthlyPaymentNotice } from './business-data'

export interface CrmState {
  stock: StockItem[]
  pedidos: Pedido[]
  presupuestos: Presupuesto[]
  ingresos: IngresoMercaderia[]
  facturas: Factura[]
  equipment: EquipmentAsset[]
  reminders: EquipmentReminder[]
  cashOpeningBalance: number
  cashMovements: CashMovement[]
  cheques: ChequeRecord[]
  monthlyPaymentNotices: MonthlyPaymentNotice[]
  monthlyPayments: MonthlyPayment[]
}

export interface CrmMutationResult {
  state: CrmState
  createdId?: string
}