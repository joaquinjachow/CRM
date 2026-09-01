export type AssetCategory = 'camion' | 'semiremolque' | 'seguridad' | 'herramienta' | 'administracion'

export type AssetStatus = 'operativo' | 'alerta' | 'vencido'

export interface EquipmentAsset {
  id: string
  nombre: string
  categoria: AssetCategory
  identificador: string
  responsable: string
  fechaAlta: string
  estado: AssetStatus
  notas?: string
}

export type ReminderType = 'vtv' | 'matafuego' | 'seguro' | 'service' | 'habilitacion' | 'rto' | 'otro'

export interface EquipmentReminder {
  id: string
  assetId: string
  tipo: ReminderType
  titulo: string
  vencimiento: string
  recordatorioDias: number
  estado: 'vigente' | 'proximo' | 'vencido'
  ultimoChequeo?: string
  notas?: string
}

export type CashMovementType = 'ingreso' | 'egreso'

export interface CashMovement {
  id: string
  fecha: string
  tipo: CashMovementType
  concepto: string
  categoria: string
  monto: number
  comprobante?: string
  notas?: string
}

export type ChequeStatus = 'pendiente' | 'depositado' | 'cobrado' | 'rechazado'

export interface ChequeRecord {
  id: string
  fechaCreacion: string
  fechaVencimiento: string
  emisor: string
  banco: string
  numero: string
  importe: number
  estado: ChequeStatus
  destino: string
  notas?: string
}

export interface MonthlyPaymentNotice {
  id: string
  titulo: string
  fechaInicio: string
  recordatorioDias: number
  notas?: string
}

export interface MonthlyPayment {
  id: string
  avisoId: string
  periodo: string
  fechaPago: string
  monto: number
  cashMovementId?: string
}

export type MonthlyPaymentState = 'programado' | 'pendiente' | 'proximo' | 'vencido' | 'pagado'

export interface MonthlyPaymentPreview {
  id: string
  avisoId: string
  titulo: string
  periodo: string
  fechaVencimiento: string
  diasRestantes: number
  estado: MonthlyPaymentState
  recordatorioDias: number
  pagoDelPeriodo?: MonthlyPayment
  ultimoPago?: MonthlyPayment
  notas?: string
}

export interface ReminderPreview {
  id: string
  assetId: string
  titulo: string
  fecha: string
  diasRestantes: number
  prioridad: 'alta' | 'media'
  estado: 'vencido' | 'proximo'
  assetNombre: string
}

export const assetCategoryLabel: Record<AssetCategory, string> = {
  camion: 'Camiones',
  semiremolque: 'Semiremolques',
  seguridad: 'Seguridad',
  herramienta: 'Herramientas',
  administracion: 'Administracion',
}

export const reminderTypeLabel: Record<ReminderType, string> = {
  vtv: 'VTV',
  matafuego: 'Matafuego',
  seguro: 'Seguro',
  service: 'Service',
  habilitacion: 'Habilitacion',
  rto: 'RTO',
  otro: 'Otro',
}

export const chequeStatusLabel: Record<ChequeStatus, string> = {
  pendiente: 'Pendiente',
  depositado: 'Depositado',
  cobrado: 'Cobrado',
  rechazado: 'Rechazado',
}

export const equipmentInitial: EquipmentAsset[] = [
  {
    id: 'eq-001',
    nombre: 'Iveco Tector 170E28',
    categoria: 'camion',
    identificador: 'AA 123 BB',
    responsable: 'Mi viejo',
    fechaAlta: '2024-02-12',
    estado: 'operativo',
    notas: 'Camion principal para fletes de madera.',
  },
  {
    id: 'eq-002',
    nombre: 'Semiremolque Playo 13,5 m',
    categoria: 'semiremolque',
    identificador: 'SM-02',
    responsable: 'Mi hermano',
    fechaAlta: '2024-04-05',
    estado: 'operativo',
    notas: 'Usado para cargas largas y tablas.',
  },
  {
    id: 'eq-003',
    nombre: 'Matafuego cabina',
    categoria: 'seguridad',
    identificador: 'MF-01',
    responsable: 'Deposito',
    fechaAlta: '2025-07-01',
    estado: 'alerta',
    notas: 'Controlar presion y vigencia.',
  },
]

export const remindersInitial: EquipmentReminder[] = [
  {
    id: 'rem-001',
    assetId: 'eq-001',
    tipo: 'vtv',
    titulo: 'VTV camion Iveco',
    vencimiento: '2026-07-20',
    recordatorioDias: 14,
    estado: 'proximo',
    ultimoChequeo: '2026-06-20',
  },
  {
    id: 'rem-002',
    assetId: 'eq-001',
    tipo: 'seguro',
    titulo: 'Seguro camion Iveco',
    vencimiento: '2026-08-11',
    recordatorioDias: 14,
    estado: 'vigente',
  },
  {
    id: 'rem-003',
    assetId: 'eq-002',
    tipo: 'rto',
    titulo: 'RTO semiremolque',
    vencimiento: '2026-07-30',
    recordatorioDias: 14,
    estado: 'vigente',
  },
  {
    id: 'rem-004',
    assetId: 'eq-003',
    tipo: 'matafuego',
    titulo: 'Matafuego cabina',
    vencimiento: '2026-07-18',
    recordatorioDias: 14,
    estado: 'proximo',
    notas: 'Revisar carga y fecha de fabricacion.',
  },
]

export const cashOpeningBalanceInitial = 250000

export const cashMovementsInitial: CashMovement[] = [
  {
    id: 'cash-001',
    fecha: '2026-07-02',
    tipo: 'ingreso',
    concepto: 'Cobro flete Mendoza',
    categoria: 'Fletes',
    monto: 180000,
    comprobante: 'REC-0021',
  },
  {
    id: 'cash-002',
    fecha: '2026-07-04',
    tipo: 'egreso',
    concepto: 'Gasoil y peajes',
    categoria: 'Viajes',
    monto: 42000,
    comprobante: 'COMP-778',
  },
  {
    id: 'cash-003',
    fecha: '2026-07-07',
    tipo: 'egreso',
    concepto: 'Compra de mercaderia',
    categoria: 'Stock',
    monto: 86000,
  },
]

export const chequesInitial: ChequeRecord[] = [
  {
    id: 'chq-001',
    fechaCreacion: '2026-06-28',
    fechaVencimiento: '2026-07-25',
    emisor: 'Maderera del Norte',
    banco: 'Banco Nacion',
    numero: '00012458',
    importe: 320000,
    estado: 'pendiente',
    destino: 'Cobro de carga junio',
    notas: 'A verificar contra factura 2026-015.',
  },
  {
    id: 'chq-002',
    fechaCreacion: '2026-07-03',
    fechaVencimiento: '2026-08-08',
    emisor: 'Transportes del Sur',
    banco: 'Banco Macro',
    numero: '00012459',
    importe: 145000,
    estado: 'depositado',
    destino: 'Pago de flete interno',
  },
]

const isoDateOnly = new Intl.DateTimeFormat('en-CA')

export const todayIso = () => isoDateOnly.format(new Date())

export const compareIsoDates = (left: string, right: string) => left.localeCompare(right)

export const daysUntil = (dateIso: string, reference = todayIso()) => {
  const target = new Date(`${dateIso}T00:00:00`)
  const ref = new Date(`${reference}T00:00:00`)
  return Math.ceil((target.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24))
}

export const getReminderState = (reminder: EquipmentReminder, reference = todayIso()) => {
  const days = daysUntil(reminder.vencimiento, reference)
  if (days < 0) {
    return { estado: 'vencido' as const, diasRestantes: days }
  }
  if (days <= reminder.recordatorioDias) {
    return { estado: 'proximo' as const, diasRestantes: days }
  }
  return { estado: 'vigente' as const, diasRestantes: days }
}

const getPeriod = (date: string) => date.slice(0, 7)

const getLastDayOfMonth = (period: string) => {
  const [year, month] = period.split('-').map(Number)
  return new Date(year, month, 0).getDate()
}

export const getMonthlyPaymentDueDate = (notice: MonthlyPaymentNotice, period: string) => {
  const day = Math.min(Number(notice.fechaInicio.slice(8, 10)), getLastDayOfMonth(period))
  return `${period}-${String(day).padStart(2, '0')}`
}

export const buildMonthlyPaymentPreviews = (
  notices: MonthlyPaymentNotice[],
  payments: MonthlyPayment[],
  reference = todayIso(),
): MonthlyPaymentPreview[] => {
  const currentPeriod = getPeriod(reference)

  return notices
    .map((notice): MonthlyPaymentPreview => {
      const startPeriod = getPeriod(notice.fechaInicio)
      const isBeforeStart = currentPeriod < startPeriod
      const periodo = isBeforeStart ? startPeriod : currentPeriod
      const fechaVencimiento = isBeforeStart
        ? notice.fechaInicio
        : getMonthlyPaymentDueDate(notice, periodo)
      const pagoDelPeriodo = payments.find((payment) => payment.avisoId === notice.id && payment.periodo === periodo)
      const ultimoPago = payments
        .filter((payment) => payment.avisoId === notice.id)
        .sort((left, right) => right.periodo.localeCompare(left.periodo))[0]
      const diasRestantes = daysUntil(fechaVencimiento, reference)
      const estado: MonthlyPaymentState = isBeforeStart
        ? 'programado'
        : pagoDelPeriodo
          ? 'pagado'
          : diasRestantes < 0
            ? 'vencido'
            : diasRestantes <= notice.recordatorioDias
              ? 'proximo'
              : 'pendiente'

      return {
        id: notice.id,
        avisoId: notice.id,
        titulo: notice.titulo,
        periodo,
        fechaVencimiento,
        diasRestantes,
        estado,
        recordatorioDias: notice.recordatorioDias,
        pagoDelPeriodo,
        ultimoPago,
        notas: notice.notas,
      }
    })
    .sort((left, right) => left.fechaVencimiento.localeCompare(right.fechaVencimiento))
}

export const getMonthlyPaymentAlerts = (previews: MonthlyPaymentPreview[]) =>
  previews.filter((item) => item.estado === 'proximo' || item.estado === 'vencido')

export const buildReminderPreviews = (
  reminders: EquipmentReminder[],
  assets: EquipmentAsset[],
  reference = todayIso(),
): ReminderPreview[] =>
  reminders
    .map((reminder): ReminderPreview => {
      const asset = assets.find((item) => item.id === reminder.assetId)
      const { estado, diasRestantes } = getReminderState(reminder, reference)
      return {
        id: reminder.id,
        assetId: reminder.assetId,
        titulo: reminder.titulo,
        fecha: reminder.vencimiento,
        diasRestantes,
        prioridad: diasRestantes <= 7 || estado === 'vencido' ? 'alta' : 'media',
        estado: estado === 'vencido' ? 'vencido' : 'proximo',
        assetNombre: asset?.nombre ?? 'Activo',
      }
    })
    .filter((item) => item.estado === 'vencido' || item.diasRestantes <= 14)
    .sort((a, b) => a.diasRestantes - b.diasRestantes)

export const formatBusinessMoney = (value: number) =>
  value.toLocaleString('es-AR', { maximumFractionDigits: 2 })

export const formatBusinessDate = (value: string) =>
  new Date(value + 'T00:00:00').toLocaleDateString('es-AR')

export const formatBusinessPeriod = (period: string) =>
  new Date(`${period}-01T00:00:00`).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })