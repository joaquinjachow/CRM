'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Truck, Package, DollarSign, Users, AlertCircle } from 'lucide-react'

interface Activity {
  id: number
  type: 'delivery' | 'payment' | 'client' | 'alert'
  title: string
  description: string
  time: string
  status?: 'completed' | 'pending' | 'warning'
}

const activities: Activity[] = [
  {
    id: 1,
    type: 'delivery',
    title: 'Flete #FL-2847 completado',
    description: 'Buenos Aires → Córdoba',
    time: 'Hace 15 min',
    status: 'completed',
  },
  {
    id: 2,
    type: 'payment',
    title: 'Pago recibido',
    description: 'Cliente: Transportes del Sur - $12,500',
    time: 'Hace 1 hora',
    status: 'completed',
  },
  {
    id: 3,
    type: 'client',
    title: 'Nuevo cliente registrado',
    description: 'Logística Andina S.A.',
    time: 'Hace 2 horas',
  },
  {
    id: 4,
    type: 'alert',
    title: 'Mantenimiento programado',
    description: 'Camión #T-034 - Revisión técnica',
    time: 'Hace 3 horas',
    status: 'warning',
  },
  {
    id: 5,
    type: 'delivery',
    title: 'Flete #FL-2846 en tránsito',
    description: 'Mendoza → Rosario',
    time: 'Hace 4 horas',
    status: 'pending',
  },
]

const iconMap = {
  delivery: Truck,
  payment: DollarSign,
  client: Users,
  alert: AlertCircle,
}

const statusStyles = {
  completed: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  warning: 'bg-destructive/10 text-destructive',
}

export function RecentActivity() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => {
          const Icon = iconMap[activity.type]
          return (
            <div key={activity.id} className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  {activity.status && (
                    <Badge variant="outline" className={statusStyles[activity.status]}>
                      {activity.status === 'completed' && 'Completado'}
                      {activity.status === 'pending' && 'En curso'}
                      {activity.status === 'warning' && 'Atención'}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
