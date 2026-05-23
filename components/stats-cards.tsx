'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TrendingUp,
  TrendingDown,
  Users,
  UserMinus,
  DollarSign,
  Target,
  Truck,
  Package,
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ElementType
  description?: string
}

function StatCard({ title, value, change, changeType = 'neutral', icon: Icon, description }: StatCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {(change || description) && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            {change && (
              <>
                {changeType === 'positive' && <TrendingUp className="h-3 w-3 text-success" />}
                {changeType === 'negative' && <TrendingDown className="h-3 w-3 text-destructive" />}
                <span
                  className={
                    changeType === 'positive'
                      ? 'text-success'
                      : changeType === 'negative'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  }
                >
                  {change}
                </span>
              </>
            )}
            {description && <span className="text-muted-foreground">{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StatsCards() {
  const stats: StatCardProps[] = [
    {
      title: 'Ventas del Mes',
      value: '$847,350',
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
      description: 'vs mes anterior',
    },
    {
      title: 'Clientes Activos',
      value: '1,284',
      change: '+48',
      changeType: 'positive',
      icon: Users,
      description: 'este mes',
    },
    {
      title: 'Clientes Perdidos',
      value: '23',
      change: '-15%',
      changeType: 'positive',
      icon: UserMinus,
      description: 'vs mes anterior',
    },
    {
      title: 'Facturación Promedio',
      value: '$2,450',
      change: '+8.2%',
      changeType: 'positive',
      icon: Target,
      description: 'por cliente',
    },
    {
      title: 'Facturación Proyectada',
      value: '$1,250,000',
      change: 'Q2 2026',
      changeType: 'neutral',
      icon: TrendingUp,
    },
    {
      title: 'Fletes Completados',
      value: '342',
      change: '+28',
      changeType: 'positive',
      icon: Truck,
      description: 'este mes',
    },
    {
      title: 'Envíos Pendientes',
      value: '67',
      change: '-12',
      changeType: 'positive',
      icon: Package,
      description: 'vs semana pasada',
    },
    {
      title: 'Tasa de Retención',
      value: '94.2%',
      change: '+2.1%',
      changeType: 'positive',
      icon: Users,
      description: 'vs trimestre anterior',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}
