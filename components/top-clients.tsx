'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Client {
  id: number
  name: string
  company: string
  totalBilled: string
  status: 'activo' | 'inactivo' | 'nuevo'
  lastOrder: string
}

const clients: Client[] = [
  {
    id: 1,
    name: 'Carlos Mendoza',
    company: 'Distribuidora Norte S.A.',
    totalBilled: '$156,400',
    status: 'activo',
    lastOrder: 'Hace 2 días',
  },
  {
    id: 2,
    name: 'María González',
    company: 'Logística Sur',
    totalBilled: '$124,800',
    status: 'activo',
    lastOrder: 'Hace 1 semana',
  },
  {
    id: 3,
    name: 'Roberto Silva',
    company: 'Transportes Andinos',
    totalBilled: '$98,500',
    status: 'nuevo',
    lastOrder: 'Hace 3 días',
  },
  {
    id: 4,
    name: 'Ana Pérez',
    company: 'Comercial del Centro',
    totalBilled: '$87,200',
    status: 'activo',
    lastOrder: 'Hace 5 días',
  },
  {
    id: 5,
    name: 'Luis Fernández',
    company: 'Express Cargo',
    totalBilled: '$76,900',
    status: 'inactivo',
    lastOrder: 'Hace 1 mes',
  },
]

const statusStyles = {
  activo: 'bg-success/10 text-success border-success/20',
  inactivo: 'bg-destructive/10 text-destructive border-destructive/20',
  nuevo: 'bg-primary/10 text-primary border-primary/20',
}

export function TopClients() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Principales Clientes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Cliente</TableHead>
              <TableHead className="text-muted-foreground">Facturado</TableHead>
              <TableHead className="text-muted-foreground">Estado</TableHead>
              <TableHead className="text-right text-muted-foreground">Último Pedido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id} className="border-border">
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.company}</p>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-foreground">{client.totalBilled}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusStyles[client.status]}>
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{client.lastOrder}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}