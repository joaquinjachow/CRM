'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Bell, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useStock } from '@/lib/stock-context'
import { formatBusinessDate, formatBusinessMoney } from '@/lib/business-data'

const DISMISSED_KEY = 'crm-dismissed-alerts'

function loadDismissed(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function saveDismissed(value: string[]) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(value))
  } catch {
  }
}

export function BusinessAlerts() {
  const { upcomingReminders, upcomingMonthlyPaymentAlerts, cheques, cashMovements, cashOpeningBalance } = useStock()
  const [hydrated, setHydrated] = useState(false)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setDismissed(loadDismissed())
    setHydrated(true)
  }, [])

  const activeAlerts = useMemo(() => {
    const paymentAlerts = upcomingMonthlyPaymentAlerts.map((item) => ({
      id: `monthly-payment-${item.avisoId}-${item.periodo}`,
      title: item.estado === 'vencido' ? 'Pago mensual vencido' : 'Pago mensual pendiente',
      detail: item.titulo,
      meta:
        item.estado === 'vencido'
          ? `Venció el ${formatBusinessDate(item.fechaVencimiento)} y todavía no fue marcado como pagado.`
          : `Vence el ${formatBusinessDate(item.fechaVencimiento)} en ${item.diasRestantes} días.`,
      tone: item.estado === 'vencido' ? 'danger' as const : 'media' as const,
      persistent: true,
    }))

    const reminders = upcomingReminders
      .filter((item) => !dismissed.includes(item.id))
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        title: item.estado === 'vencido' ? 'Vencimiento vencido' : 'Vencimiento proximo',
        detail: `${item.titulo} · ${item.assetNombre}`,
        meta:
          item.estado === 'vencido'
            ? `Vencio el ${formatBusinessDate(item.fecha)}`
            : `Vence el ${formatBusinessDate(item.fecha)} en ${item.diasRestantes} dias`,
        tone: item.estado === 'vencido' ? 'danger' : item.prioridad,
        persistent: false,
      }))

    const nextCheque = cheques
      .filter((item) => item.estado === 'pendiente')
      .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento))[0]
    const chequeAlert =
      nextCheque && !dismissed.includes(`cheque-${nextCheque.id}`)
        ? [
            {
              id: `cheque-${nextCheque.id}`,
              title: 'Cheque pendiente cercano',
              detail: `${nextCheque.emisor} · ${nextCheque.banco}`,
              meta: `Vence el ${formatBusinessDate(nextCheque.fechaVencimiento)} por $${formatBusinessMoney(nextCheque.importe)}`,
              tone: 'media' as const,
              persistent: false,
            },
          ]
        : []
    return [...paymentAlerts, ...reminders, ...chequeAlert]
  }, [cheques, dismissed, upcomingMonthlyPaymentAlerts, upcomingReminders])

  const cashBalance = cashOpeningBalance + cashMovements.reduce((sum, movement) => {
    return movement.tipo === 'ingreso' ? sum + movement.monto : sum - movement.monto
  }, 0)

  const dismiss = (id: string) => {
    const next = [...dismissed, id]
    setDismissed(next)
    saveDismissed(next)
  }

  const dismissAll = () => setCollapsed(true)
  const hasPersistentAlerts = activeAlerts.some((alert) => alert.persistent)

  if (!hydrated || activeAlerts.length === 0) return null

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-border/60 bg-card/95 px-4 py-3 text-sm font-medium text-foreground shadow-xl backdrop-blur transition-transform hover:scale-[1.02]"
      >
        <Bell className="h-5 w-5 text-primary" />
        <span>Alertas</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
          {activeAlerts.length}
        </span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[min(92vw,22rem)] flex-col gap-3">
      <Card className="border-border/60 bg-card/95 p-4 shadow-xl backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Panel de alertas</p>
          </div>
          {!hasPersistentAlerts && (
            <Button variant="ghost" size="icon" onClick={dismissAll} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {activeAlerts.map((alert) => (
            <div key={alert.id} className="rounded-lg border border-border/70 bg-muted/30 p-3">
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {alert.tone === 'danger' ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-warning" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">{alert.detail}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{alert.meta}</p>
                  {alert.persistent && (
                    <Link href="/finanzas" className="mt-2 inline-flex text-xs font-medium text-primary hover:underline">
                      Ver pagos mensuales
                    </Link>
                  )}
                </div>
                {!alert.persistent && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => dismiss(alert.id)}
                    className="h-7 w-7 shrink-0 text-muted-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}