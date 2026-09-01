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
import { ShieldCheck, Truck, Clock3, AlertTriangle, CirclePlus, ClipboardList } from 'lucide-react'
import { useStock } from '@/lib/stock-context'
import { assetCategoryLabel, formatBusinessDate, formatBusinessMoney, reminderTypeLabel, type AssetCategory, type ReminderType } from '@/lib/business-data'

const defaultAsset = {
  nombre: '',
  categoria: 'camion' as AssetCategory,
  identificador: '',
  fechaAlta: new Date().toISOString().split('T')[0],
  estado: 'operativo' as const,
  notas: '',
}

const defaultReminder = {
  assetId: '',
  tipo: 'vtv' as ReminderType,
  titulo: '',
  vencimiento: new Date().toISOString().split('T')[0],
  recordatorioDias: '14',
  notas: '',
}

export default function EquipamientoPage() {
  const { equipment, reminders, upcomingReminders, agregarEquipo, agregarRecordatorio } = useStock()
  const [assetForm, setAssetForm] = useState(defaultAsset)
  const [reminderForm, setReminderForm] = useState(defaultReminder)

  const activosPorCategoria = useMemo(() => {
    return equipment.reduce<Record<string, number>>((acc, item) => {
      acc[item.categoria] = (acc[item.categoria] ?? 0) + 1
      return acc
    }, {})
  }, [equipment])

  const activosOperativos = equipment.filter((item) => item.estado === 'operativo').length
  const activosConAlerta = equipment.filter((item) => item.estado === 'alerta').length
  const vencidos = upcomingReminders.filter((item) => item.estado === 'vencido').length
  const proximos = upcomingReminders.filter((item) => item.estado === 'proximo').length

  const submitAsset = async () => {
    if (!assetForm.nombre.trim() || !assetForm.identificador.trim()) return
    const asset = await agregarEquipo({
      nombre: assetForm.nombre.trim(),
      categoria: assetForm.categoria,
      identificador: assetForm.identificador.trim(),
      responsable: 'Sin asignar',
      fechaAlta: assetForm.fechaAlta,
      estado: assetForm.estado,
      notas: assetForm.notas.trim() || undefined,
    })
    if (asset) setAssetForm(defaultAsset)
  }

  const submitReminder = async () => {
    const dias = parseInt(reminderForm.recordatorioDias, 10)
    if (!reminderForm.assetId || !reminderForm.titulo.trim() || Number.isNaN(dias)) return
    const reminder = await agregarRecordatorio({
      assetId: reminderForm.assetId,
      tipo: reminderForm.tipo,
      titulo: reminderForm.titulo.trim(),
      vencimiento: reminderForm.vencimiento,
      recordatorioDias: dias,
      ultimoChequeo: new Date().toISOString().split('T')[0],
      notas: reminderForm.notas.trim() || undefined,
    })
    if (reminder) setReminderForm(defaultReminder)
  }

  return (
    <PageShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Equipamiento</h1>
        <p className="text-muted-foreground">
          Camiones, semiremolques, matafuegos y vencimientos para que nada se te pase.
        </p>
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/50 bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Activos totales</p>
              <p className="text-xl font-bold text-foreground">{equipment.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Operativos</p>
              <p className="text-xl font-bold text-foreground">{activosOperativos}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock3 className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vencimientos proximos</p>
              <p className="text-xl font-bold text-foreground">{proximos}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vencidos</p>
              <p className="text-xl font-bold text-foreground">{vencidos}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CirclePlus className="h-5 w-5 text-primary" />
              Registrar activo
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="assetNombre">Nombre</Label>
              <Input
                id="assetNombre"
                value={assetForm.nombre}
                onChange={(e) => setAssetForm({ ...assetForm, nombre: e.target.value })}
                placeholder="Camion, matafuego, semiremolque..."
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={assetForm.categoria}
                onValueChange={(value) => setAssetForm({ ...assetForm, categoria: value as AssetCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(assetCategoryLabel).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetId">Identificador</Label>
              <Input
                id="assetId"
                value={assetForm.identificador}
                onChange={(e) => setAssetForm({ ...assetForm, identificador: e.target.value })}
                placeholder="Patente, numero interno, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetFecha">Fecha alta</Label>
              <Input
                id="assetFecha"
                type="date"
                value={assetForm.fechaAlta}
                onChange={(e) => setAssetForm({ ...assetForm, fechaAlta: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="assetNotas">Notas</Label>
              <Input
                id="assetNotas"
                value={assetForm.notas}
                onChange={(e) => setAssetForm({ ...assetForm, notas: e.target.value })}
                placeholder="Observaciones utiles"
              />
            </div>
            <Button onClick={submitAsset} className="sm:col-span-2 gap-2">
              <Truck className="h-4 w-4" />
              Guardar activo
            </Button>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Cargar vencimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Activo</Label>
              <Select value={reminderForm.assetId} onValueChange={(value) => setReminderForm({ ...reminderForm, assetId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar activo" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nombre} ({item.identificador})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={reminderForm.tipo} onValueChange={(value) => setReminderForm({ ...reminderForm, tipo: value as ReminderType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(reminderTypeLabel).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remTitulo">Titulo</Label>
              <Input
                id="remTitulo"
                value={reminderForm.titulo}
                onChange={(e) => setReminderForm({ ...reminderForm, titulo: e.target.value })}
                placeholder="VTV camion, matafuego, seguro..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remVencimiento">Vencimiento</Label>
              <Input
                id="remVencimiento"
                type="date"
                value={reminderForm.vencimiento}
                onChange={(e) => setReminderForm({ ...reminderForm, vencimiento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remDias">Avisar antes</Label>
              <Input
                id="remDias"
                type="number"
                min={1}
                value={reminderForm.recordatorioDias}
                onChange={(e) => setReminderForm({ ...reminderForm, recordatorioDias: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="remNotas">Notas</Label>
              <Input
                id="remNotas"
                value={reminderForm.notas}
                onChange={(e) => setReminderForm({ ...reminderForm, notas: e.target.value })}
                placeholder="Observaciones del vencimiento"
              />
            </div>
            <Button onClick={submitReminder} className="sm:col-span-2 gap-2" disabled={!equipment.length}>
              <ClipboardList className="h-4 w-4" />
              Guardar vencimiento
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Proximos vencimientos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingReminders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay alertas proximas. Registra un activo y carga su vencimiento para comenzar.
              </p>
            ) : (
              upcomingReminders.map((item) => {
                const { diasRestantes } = item
                return (
                  <div key={item.id} className="rounded-lg border border-border/70 bg-muted/20 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{item.titulo}</p>
                        <p className="text-sm text-muted-foreground">{item.assetNombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.estado === 'vencido'
                            ? `Vencido el ${formatBusinessDate(item.fecha)}`
                            : `Vence el ${formatBusinessDate(item.fecha)} en ${diasRestantes} dias`}
                        </p>
                      </div>
                      <Badge
                        className={
                          item.estado === 'vencido'
                            ? 'border-red-500/20 bg-red-500/10 text-red-500'
                            : 'border-amber-500/20 bg-amber-500/10 text-amber-500'
                        }
                      >
                        {item.estado === 'vencido' ? 'Vencido' : `${diasRestantes} dias`}
                      </Badge>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Equipamiento cargado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Nombre</TableHead>
                    <TableHead className="text-muted-foreground">Categoria</TableHead>
                    <TableHead className="text-muted-foreground">Identificador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.length === 0 ? (
                    <TableRow className="border-border/50">
                      <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                        Todavia no hay equipamiento cargado. Registra un activo para comenzar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    equipment.map((item) => (
                      <TableRow key={item.id} className="border-border/50">
                        <TableCell className="font-medium text-foreground">{item.nombre}</TableCell>
                        <TableCell className="text-muted-foreground">{assetCategoryLabel[item.categoria]}</TableCell>
                        <TableCell className="text-muted-foreground">{item.identificador}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}