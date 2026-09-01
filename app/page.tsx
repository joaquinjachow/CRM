'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PageShell } from '@/components/page-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useStock } from '@/lib/stock-context'
import { formatBusinessDate, formatBusinessMoney } from '@/lib/business-data'
import { Banknote, ClipboardList, Bell, FileText, Package, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function HomePage() {
  const { stock, equipment, cheques, cashMovements, cashOpeningBalance, upcomingReminders, upcomingMonthlyPaymentAlerts } = useStock()
  const [alertasAbiertas, setAlertasAbiertas] = useState(false)

  const cashBalance =
    cashOpeningBalance +
    cashMovements.reduce((sum, movement) => (movement.tipo === 'ingreso' ? sum + movement.monto : sum - movement.monto), 0)
  const chequePendiente = cheques.filter((item) => item.estado === 'pendiente').length
  const alertas = upcomingReminders.length + upcomingMonthlyPaymentAlerts.length
  const alertasRapidas = useMemo(() => {
    const paymentAlerts = upcomingMonthlyPaymentAlerts.map((item) => ({
      id: `monthly-payment-${item.avisoId}-${item.periodo}`,
      title: item.estado === 'vencido' ? 'Pago mensual vencido' : 'Pago mensual pendiente',
      detail: item.titulo,
      meta:
        item.estado === 'vencido'
          ? `Venció el ${formatBusinessDate(item.fechaVencimiento)} y todavía no fue marcado como pagado.`
          : `Vence el ${formatBusinessDate(item.fechaVencimiento)} en ${item.diasRestantes} días.`,
      tone: item.estado === 'vencido' ? 'danger' as const : 'warning' as const,
    }))

    const reminders = upcomingReminders.slice(0, 3).map((item) => ({
      id: item.id,
      title: item.estado === 'vencido' ? 'Vencimiento vencido' : 'Vencimiento proximo',
      detail: `${item.titulo} · ${item.assetNombre}`,
      meta:
        item.estado === 'vencido'
          ? `Venció el ${formatBusinessDate(item.fecha)}`
          : `Vence el ${formatBusinessDate(item.fecha)} en ${item.diasRestantes} dias`,
      tone: item.estado === 'vencido' ? 'danger' : 'warning',
    }))

    const nextCheque = cheques
      .filter((item) => item.estado === 'pendiente')
      .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento))[0]
    const chequeAlert = nextCheque
      ? [
          {
            id: `cheque-${nextCheque.id}`,
            title: 'Cheque pendiente cercano',
            detail: `${nextCheque.emisor} · ${nextCheque.banco}`,
            meta: `Vence el ${formatBusinessDate(nextCheque.fechaVencimiento)} por $${formatBusinessMoney(nextCheque.importe)}`,
            tone: 'media' as const,
          },
        ]
      : []
    return [...paymentAlerts, ...reminders, ...chequeAlert]
  }, [cheques, upcomingMonthlyPaymentAlerts, upcomingReminders])

  const ingresos = cashMovements.filter((item) => item.tipo === 'ingreso').slice(0, 4)

  return (
    <PageShell>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Inicio</h1>
          </div>
          <p className="text-muted-foreground">
            Resumen operativo del negocio.
          </p>
        </div>
        <div className="relative shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAlertasAbiertas((value) => !value)}
            className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label="Ver alertas"
          >
            <Bell className="h-5 w-5" />
            {alertas > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-destructive" />
            )}
          </Button>
          {alertasAbiertas && alertasRapidas.length > 0 && (
            <Card className="absolute right-0 top-full z-20 w-[min(92vw,21rem)] border-border/50 bg-card shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Bell className="h-5 w-5 text-primary" />
                  Alertas
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAlertasAbiertas(false)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  aria-label="Cerrar alertas"
                >
                  <span className="text-lg leading-none">×</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {alertasRapidas.map((alerta) => (
                  <div key={alerta.id} className="rounded-lg border border-border/70 bg-muted/20 p-2.5">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {alerta.tone === 'danger' ? (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-warning" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{alerta.title}</p>
                        <p className="text-xs text-muted-foreground">{alerta.detail}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{alerta.meta}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {upcomingMonthlyPaymentAlerts.length > 0 && (
                  <Link
                    href="/finanzas"
                    onClick={() => setAlertasAbiertas(false)}
                    className="inline-flex pt-1 text-sm font-medium text-primary hover:underline"
                  >
                    Ver pagos mensuales
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/50 bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stock cargado</p>
              <p className="text-xl font-bold text-foreground">{stock.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Banknote className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Caja actual</p>
              <p className="text-xl font-bold text-foreground">$ {formatBusinessMoney(cashBalance)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <ClipboardList className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cheques pendientes</p>
              <p className="text-xl font-bold text-foreground">{chequePendiente}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alertas proximas</p>
              <p className="text-xl font-bold text-foreground">{alertas}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Vencimientos proximos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingReminders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay vencimientos cercanos.</p>
            ) : (
              upcomingReminders.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-lg border border-border/70 bg-muted/20 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{item.titulo}</p>
                      <p className="text-sm text-muted-foreground">{item.assetNombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.estado === 'vencido'
                          ? `Vencido el ${formatBusinessDate(item.fecha)}`
                          : `Vence el ${formatBusinessDate(item.fecha)} en ${item.diasRestantes} dias`}
                      </p>
                    </div>
                    <Badge variant={item.estado === 'vencido' ? 'destructive' : 'secondary'}>
                      {item.estado === 'vencido' ? 'Vencido' : `En ${item.diasRestantes} dias`}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <FileText className="h-5 w-5 text-primary" />
              Ultimos ingresos de caja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Fecha</TableHead>
                    <TableHead className="text-muted-foreground">Concepto</TableHead>
                    <TableHead className="text-right text-muted-foreground">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingresos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                        No hay ingresos cargados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ingresos.map((item) => (
                      <TableRow key={item.id} className="border-border/50">
                        <TableCell className="text-muted-foreground">{formatBusinessDate(item.fecha)}</TableCell>
                        <TableCell className="font-medium text-foreground">{item.concepto}</TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          $ {formatBusinessMoney(item.monto)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-end">
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
