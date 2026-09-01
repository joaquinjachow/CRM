'use client'
import { useMemo, useState } from 'react'
import { PageShell } from '@/components/page-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Banknote, ArrowDownRight, ArrowUpRight, BellRing, CalendarClock, CheckCircle2, CirclePlus, FileText, WalletCards } from 'lucide-react'
import { useStock } from '@/lib/stock-context'
import { formatBusinessDate, formatBusinessMoney, formatBusinessPeriod, chequeStatusLabel, type CashMovementType, type ChequeStatus, type MonthlyPaymentPreview } from '@/lib/business-data'

const movementDefault = {
  tipo: 'ingreso' as CashMovementType,
  concepto: '',
  categoria: 'General',
  monto: '',
  comprobante: '',
  notas: '',
}

const chequeDefault = {
  emisor: '',
  banco: '',
  numero: '',
  importe: '',
  fechaVencimiento: new Date().toISOString().split('T')[0],
  estado: 'pendiente' as ChequeStatus,
  destino: '',
  notas: '',
}

const monthlyPaymentNoticeDefault = {
  titulo: '',
  fechaInicio: new Date().toISOString().split('T')[0],
  recordatorioDias: '7',
  notas: '',
}

const monthlyPaymentStateLabel = {
  programado: 'Programado',
  pendiente: 'Pendiente',
  proximo: 'Por vencer',
  vencido: 'Vencido',
  pagado: 'Pagado',
} as const

export default function FinanzasPage() {
  const {
    cashOpeningBalance,
    cashMovements,
    cheques,
    monthlyPaymentNotices,
    monthlyPayments,
    monthlyPaymentPreviews,
    agregarMovimientoCaja,
    agregarCheque,
    actualizarCheque,
    agregarAvisoPagoMensual,
    marcarAvisoPagoMensualPagado,
  } = useStock()
  const [movementForm, setMovementForm] = useState(movementDefault)
  const [chequeForm, setChequeForm] = useState(chequeDefault)
  const [monthlyPaymentNoticeForm, setMonthlyPaymentNoticeForm] = useState(monthlyPaymentNoticeDefault)
  const [paymentToConfirm, setPaymentToConfirm] = useState<MonthlyPaymentPreview | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')

  const ingresos = cashMovements
    .filter((item) => item.tipo === 'ingreso')
    .reduce((sum, item) => sum + item.monto, 0)
  const egresos = cashMovements
    .filter((item) => item.tipo === 'egreso')
    .reduce((sum, item) => sum + item.monto, 0)
  const saldoActual = cashOpeningBalance + ingresos - egresos
  const chequesPendientes = cheques.filter((item) => item.estado === 'pendiente')
  const chequesDepositados = cheques.filter((item) => item.estado === 'depositado').length

  const siguienteCheque = useMemo(() => {
    return [...cheques]
      .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento))
      .find((item) => item.estado === 'pendiente')
  }, [cheques])

  const monthlyPaymentHistory = useMemo(
    () => [...monthlyPayments].sort((left, right) => (
      right.periodo.localeCompare(left.periodo) || right.fechaPago.localeCompare(left.fechaPago)
    )),
    [monthlyPayments],
  )

  const submitMovement = async () => {
    const amount = parseFloat(movementForm.monto)
    if (!movementForm.concepto.trim() || Number.isNaN(amount) || amount <= 0) return
    const movement = await agregarMovimientoCaja({
      fecha: new Date().toISOString().split('T')[0],
      tipo: movementForm.tipo,
      concepto: movementForm.concepto.trim(),
      categoria: movementForm.categoria.trim(),
      monto: amount,
      comprobante: movementForm.comprobante.trim() || undefined,
      notas: movementForm.notas.trim() || undefined,
    })
    if (movement) setMovementForm(movementDefault)
  }

  const submitCheque = async () => {
    const amount = parseFloat(chequeForm.importe)
    if (!chequeForm.emisor.trim() || !chequeForm.banco.trim() || !chequeForm.numero.trim() || Number.isNaN(amount) || amount <= 0) return
    const cheque = await agregarCheque({
      fechaVencimiento: chequeForm.fechaVencimiento,
      emisor: chequeForm.emisor.trim(),
      banco: chequeForm.banco.trim(),
      numero: chequeForm.numero.trim(),
      importe: amount,
      estado: chequeForm.estado,
      destino: chequeForm.destino.trim(),
      notas: chequeForm.notas.trim() || undefined,
    })
    if (cheque) setChequeForm(chequeDefault)
  }

  const submitMonthlyPaymentNotice = async () => {
    const recordatorioDias = parseInt(monthlyPaymentNoticeForm.recordatorioDias, 10)
    if (!monthlyPaymentNoticeForm.titulo.trim() || !monthlyPaymentNoticeForm.fechaInicio || Number.isNaN(recordatorioDias) || recordatorioDias < 0) return
    const notice = await agregarAvisoPagoMensual({
      titulo: monthlyPaymentNoticeForm.titulo.trim(),
      fechaInicio: monthlyPaymentNoticeForm.fechaInicio,
      recordatorioDias,
      notas: monthlyPaymentNoticeForm.notas.trim() || undefined,
    })
    if (notice) setMonthlyPaymentNoticeForm(monthlyPaymentNoticeDefault)
  }

  const openPaymentConfirmation = (payment: MonthlyPaymentPreview) => {
    setPaymentToConfirm(payment)
    setPaymentAmount('')
  }

  const confirmMonthlyPayment = async () => {
    if (!paymentToConfirm) return
    const monto = parseFloat(paymentAmount)
    if (Number.isNaN(monto) || monto <= 0) return
    const payment = await marcarAvisoPagoMensualPagado(paymentToConfirm.avisoId, paymentToConfirm.periodo, monto)
    if (payment) {
      setPaymentToConfirm(null)
      setPaymentAmount('')
    }
  }

  return (
    <PageShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Caja y Cheques</h1>
        <p className="text-muted-foreground">
          Saldo actual, historial de movimientos y cheques con vencimientos para control diario.
        </p>
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/50 bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <WalletCards className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo actual</p>
              <p className="text-xl font-bold text-foreground">$ {formatBusinessMoney(saldoActual)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <ArrowUpRight className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ingresos</p>
              <p className="text-xl font-bold text-foreground">$ {formatBusinessMoney(ingresos)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <ArrowDownRight className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Egresos</p>
              <p className="text-xl font-bold text-foreground">$ {formatBusinessMoney(egresos)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Banknote className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cheques pendientes</p>
              <p className="text-xl font-bold text-foreground">{chequesPendientes.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <BellRing className="h-5 w-5 text-primary" />
              Nuevo aviso de pago mensual
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="paymentNoticeTitle">Pago a recordar</Label>
              <Input
                id="paymentNoticeTitle"
                value={monthlyPaymentNoticeForm.titulo}
                onChange={(event) => setMonthlyPaymentNoticeForm({ ...monthlyPaymentNoticeForm, titulo: event.target.value })}
                placeholder="Seguro, alquiler, monotributo..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentNoticeDate">Primer vencimiento</Label>
              <Input
                id="paymentNoticeDate"
                type="date"
                value={monthlyPaymentNoticeForm.fechaInicio}
                onChange={(event) => setMonthlyPaymentNoticeForm({ ...monthlyPaymentNoticeForm, fechaInicio: event.target.value })}
              />
              <p className="text-xs text-muted-foreground">Se repetirá ese día todos los meses.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentNoticeReminderDays">Avisar con anticipación</Label>
              <Input
                id="paymentNoticeReminderDays"
                type="number"
                min={0}
                value={monthlyPaymentNoticeForm.recordatorioDias}
                onChange={(event) => setMonthlyPaymentNoticeForm({ ...monthlyPaymentNoticeForm, recordatorioDias: event.target.value })}
                placeholder="7"
              />
              <p className="text-xs text-muted-foreground">Cantidad de días antes del vencimiento.</p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="paymentNoticeNotes">Notas</Label>
              <Input
                id="paymentNoticeNotes"
                value={monthlyPaymentNoticeForm.notas}
                onChange={(event) => setMonthlyPaymentNoticeForm({ ...monthlyPaymentNoticeForm, notas: event.target.value })}
                placeholder="Datos útiles para hacer el pago"
              />
            </div>
            <Button onClick={submitMonthlyPaymentNotice} className="gap-2 sm:col-span-2">
              <BellRing className="h-4 w-4" />
              Guardar aviso mensual
            </Button>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CalendarClock className="h-5 w-5 text-primary" />
              Pagos mensuales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {monthlyPaymentPreviews.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                No hay avisos de pagos mensuales. Cargá el primero para recibir recordatorios y registrar cada importe.
              </p>
            ) : (
              monthlyPaymentPreviews.map((item) => (
                <div key={item.id} className="rounded-lg border border-border/70 bg-muted/20 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{item.titulo}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.estado === 'programado'
                          ? `Comienza el ${formatBusinessDate(item.fechaVencimiento)}`
                          : `Vence el ${formatBusinessDate(item.fechaVencimiento)} · ${formatBusinessPeriod(item.periodo)}`}
                      </p>
                      {item.notas && <p className="mt-1 text-xs text-muted-foreground">{item.notas}</p>}
                      {item.pagoDelPeriodo ? (
                        <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                          Pagado el {formatBusinessDate(item.pagoDelPeriodo.fechaPago)} por $ {formatBusinessMoney(item.pagoDelPeriodo.monto)}
                        </p>
                      ) : item.ultimoPago ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Último pago: {formatBusinessPeriod(item.ultimoPago.periodo)} · $ {formatBusinessMoney(item.ultimoPago.monto)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-row items-center gap-2 sm:flex-col sm:items-end">
                      <Badge variant={item.estado === 'vencido' ? 'destructive' : item.estado === 'pagado' ? 'secondary' : 'outline'}>
                        {monthlyPaymentStateLabel[item.estado]}
                      </Badge>
                      {item.estado !== 'programado' && item.estado !== 'pagado' && (
                        <Button size="sm" onClick={() => openPaymentConfirmation(item)} className="gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          Marcar pagado
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {monthlyPaymentHistory.length > 0 && (
              <div className="border-t border-border/70 pt-4">
                <p className="mb-2 text-sm font-medium text-foreground">Últimos pagos registrados</p>
                <div className="space-y-2">
                  {monthlyPaymentHistory.slice(0, 6).map((payment) => {
                    const notice = monthlyPaymentNotices.find((item) => item.id === payment.avisoId)
                    return (
                      <div key={payment.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="truncate text-foreground">{notice?.titulo ?? 'Aviso eliminado'}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatBusinessPeriod(payment.periodo)} · Pagado el {formatBusinessDate(payment.fechaPago)}
                          </p>
                        </div>
                        <p className="shrink-0 font-medium text-foreground">$ {formatBusinessMoney(payment.monto)}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CirclePlus className="h-5 w-5 text-primary" />
              Registrar movimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={movementForm.tipo}
                onValueChange={(value) => setMovementForm({ ...movementForm, tipo: value as CashMovementType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingreso">Ingreso</SelectItem>
                  <SelectItem value="egreso">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="movMonto">Monto</Label>
              <Input
                id="movMonto"
                type="number"
                min={1}
                value={movementForm.monto}
                onChange={(e) => setMovementForm({ ...movementForm, monto: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="movConcepto">Concepto</Label>
              <Input
                id="movConcepto"
                value={movementForm.concepto}
                onChange={(e) => setMovementForm({ ...movementForm, concepto: e.target.value })}
                placeholder="Cobro, gasto, compra, retiro..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="movCategoria">Categoria</Label>
              <Input
                id="movCategoria"
                value={movementForm.categoria}
                onChange={(e) => setMovementForm({ ...movementForm, categoria: e.target.value })}
                placeholder="Viajes, stock, oficina..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="movComprobante">Comprobante</Label>
              <Input
                id="movComprobante"
                value={movementForm.comprobante}
                onChange={(e) => setMovementForm({ ...movementForm, comprobante: e.target.value })}
                placeholder="OP, recibo, factura..."
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="movNotas">Notas</Label>
              <Input
                id="movNotas"
                value={movementForm.notas}
                onChange={(e) => setMovementForm({ ...movementForm, notas: e.target.value })}
                placeholder="Observaciones"
              />
            </div>
            <Button onClick={submitMovement} className="sm:col-span-2 gap-2">
              <CirclePlus className="h-4 w-4" />
              Guardar movimiento
            </Button>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <FileText className="h-5 w-5 text-primary" />
              Agregar cheque
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Emisor</Label>
              <Input value={chequeForm.emisor} onChange={(e) => setChequeForm({ ...chequeForm, emisor: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Banco</Label>
              <Input value={chequeForm.banco} onChange={(e) => setChequeForm({ ...chequeForm, banco: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Numero</Label>
              <Input value={chequeForm.numero} onChange={(e) => setChequeForm({ ...chequeForm, numero: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Importe</Label>
              <Input type="number" min={1} value={chequeForm.importe} onChange={(e) => setChequeForm({ ...chequeForm, importe: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Vencimiento</Label>
              <Input type="date" value={chequeForm.fechaVencimiento} onChange={(e) => setChequeForm({ ...chequeForm, fechaVencimiento: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={chequeForm.estado} onValueChange={(value) => setChequeForm({ ...chequeForm, estado: value as ChequeStatus })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(chequeStatusLabel).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Destino</Label>
              <Input value={chequeForm.destino} onChange={(e) => setChequeForm({ ...chequeForm, destino: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Notas</Label>
              <Input value={chequeForm.notas} onChange={(e) => setChequeForm({ ...chequeForm, notas: e.target.value })} />
            </div>
            <Button onClick={submitCheque} className="sm:col-span-2 gap-2">
              <Banknote className="h-4 w-4" />
              Guardar cheque
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Historial de movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Fecha</TableHead>
                    <TableHead className="text-muted-foreground">Concepto</TableHead>
                    <TableHead className="text-muted-foreground">Categoria</TableHead>
                    <TableHead className="text-muted-foreground">Tipo</TableHead>
                    <TableHead className="text-right text-muted-foreground">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashMovements.length === 0 ? (
                    <TableRow className="border-border/50">
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        No hay movimientos registrados. Carga un ingreso o egreso para comenzar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cashMovements.map((item) => (
                      <TableRow key={item.id} className="border-border/50">
                        <TableCell className="text-muted-foreground">{formatBusinessDate(item.fecha)}</TableCell>
                        <TableCell className="font-medium text-foreground">{item.concepto}</TableCell>
                        <TableCell className="text-muted-foreground">{item.categoria}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          $ {formatBusinessMoney(item.monto)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Cheques registrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Vencimiento</TableHead>
                    <TableHead className="text-muted-foreground">Emisor</TableHead>
                    <TableHead className="text-muted-foreground">Banco</TableHead>
                    <TableHead className="text-right text-muted-foreground">Importe</TableHead>
                    <TableHead className="text-muted-foreground">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cheques.length === 0 ? (
                    <TableRow className="border-border/50">
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        No hay cheques registrados. Agrega un cheque para comenzar el seguimiento.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cheques.map((item) => (
                      <TableRow key={item.id} className="border-border/50">
                        <TableCell className="text-muted-foreground">{formatBusinessDate(item.fechaVencimiento)}</TableCell>
                        <TableCell className="font-medium text-foreground">{item.emisor}</TableCell>
                        <TableCell className="text-muted-foreground">{item.banco}</TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          $ {formatBusinessMoney(item.importe)}
                        </TableCell>
                        <TableCell>
                          <Select value={item.estado} onValueChange={(value) => actualizarCheque(item.id, { estado: value as ChequeStatus })}>
                            <SelectTrigger className="h-8 w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(chequeStatusLabel).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 rounded-lg border border-border/70 bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Cheque mas cercano</p>
              {siguienteCheque ? (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{siguienteCheque.emisor}</p>
                    <p className="text-sm text-muted-foreground">{siguienteCheque.banco}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">$ {formatBusinessMoney(siguienteCheque.importe)}</p>
                    <p className="text-sm text-muted-foreground">{formatBusinessDate(siguienteCheque.fechaVencimiento)}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No hay cheques pendientes.</p>
              )}
              <p className="mt-3 text-sm text-muted-foreground">
                Depositados: {chequesDepositados} · Pendientes: {chequesPendientes.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={paymentToConfirm !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentToConfirm(null)
            setPaymentAmount('')
          }
        }}
      >
        <DialogContent className="border-border/50 bg-card">
          <DialogHeader>
            <DialogTitle>Registrar pago de {paymentToConfirm?.titulo}</DialogTitle>
            <DialogDescription>
              ¿Cuánto costó este mes? El importe queda guardado en el historial y como egreso de Caja.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="monthlyPaymentAmount">Importe pagado</Label>
            <Input
              id="monthlyPaymentAmount"
              type="number"
              min={0.01}
              step="0.01"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
              placeholder="0"
              autoFocus
            />
            {paymentToConfirm && (
              <p className="text-xs text-muted-foreground">
                Período: {formatBusinessPeriod(paymentToConfirm.periodo)}. Se registrará automáticamente como egreso de Caja.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentToConfirm(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmMonthlyPayment} disabled={!paymentAmount || Number(paymentAmount) <= 0} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Confirmar pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}