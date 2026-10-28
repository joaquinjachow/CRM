'use client'
import { useMemo, useState } from 'react'
import { PageShell } from '@/components/page-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCompany } from '@/lib/company-context'
import { type Client } from '@/lib/stock-data'
import { useStock } from '@/lib/stock-context'
import { Pencil, Plus, Search, Trash2, Users } from 'lucide-react'

type ClientDraft = Omit<Client, 'id'>

const emptyClient: ClientDraft = {
  nombre: '',
  apellido: '',
  empresa: '',
  direccion: '',
  banco: '',
  titularCuenta: '',
  cuit: '',
  cbu: '',
  alias: '',
}

function showValue(value: string) {
  return value || '—'
}

export default function ClientsPage() {
  const { clients, agregarCliente, actualizarCliente, eliminarCliente } = useStock()
  const { can } = useCompany()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [draft, setDraft] = useState<ClientDraft>(emptyClient)
  const [saving, setSaving] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const canWrite = can('customers:write')

  const filteredClients = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return clients
    return clients.filter((client) => Object.values(client).some((value) => value.toLocaleLowerCase().includes(query)))
  }, [clients, search])

  function openCreate() {
    setEditingClient(null)
    setDraft({ ...emptyClient })
    setError('')
    setDialogOpen(true)
  }

  function openEdit(client: Client) {
    setEditingClient(client)
    setDraft({ ...client })
    setError('')
    setDialogOpen(true)
  }

  function change(field: keyof ClientDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  async function save() {
    setSaving(true)
    setError('')
    const saved = editingClient
      ? await actualizarCliente(editingClient.id, draft)
      : await agregarCliente(draft)
    if (!saved) {
      setError('No se pudo guardar el cliente. Intentá nuevamente.')
      setSaving(false)
      return
    }
    setDialogOpen(false)
    setSaving(false)
  }

  async function remove() {
    if (!clientToDelete) return
    setDeletingId(clientToDelete.id)
    setError('')
    const deleted = await eliminarCliente(clientToDelete.id)
    if (!deleted) setError('No se pudo eliminar el cliente. Intentá nuevamente.')
    setDeletingId(null)
    if (deleted) setClientToDelete(null)
  }

  return (
    <PageShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Clientes</h1>
          <p className="mt-1 text-muted-foreground">Administrá los datos de contacto, entrega y cuenta bancaria de cada cliente.</p>
        </div>
        {canWrite && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />Agregar cliente
          </Button>
        )}
      </div>

      <Card className="mb-6 border-border/50 bg-card">
        <CardContent className="p-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, empresa, dirección, CBU, alias o CUIT..."
              className="border-border/50 bg-background pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5 text-primary" />
            Listado de clientes
            <Badge variant="secondary">{filteredClients.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {error && <p role="alert" className="mx-6 mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] border-collapse text-sm">
              <thead>
                <tr className="border-y border-border bg-muted/40 text-left">
                  <th className="border-x border-border px-3 py-2.5 font-semibold text-muted-foreground">Nombre</th>
                  <th className="border-x border-border px-3 py-2.5 font-semibold text-muted-foreground">Apellido</th>
                  <th className="border-x border-border px-3 py-2.5 font-semibold text-muted-foreground">Empresa</th>
                  <th className="border-x border-border px-3 py-2.5 font-semibold text-muted-foreground">Dirección empresa / entrega</th>
                  <th className="border-x border-border px-3 py-2.5 font-semibold text-muted-foreground">Banco</th>
                  <th className="border-x border-border px-3 py-2.5 font-semibold text-muted-foreground">Titular de cuenta</th>
                  <th className="border-x border-border px-3 py-2.5 font-semibold text-muted-foreground">CUIT / CUIL</th>
                  <th className="border-x border-border px-3 py-2.5 font-semibold text-muted-foreground">CBU</th>
                  <th className="border-x border-border px-3 py-2.5 font-semibold text-muted-foreground">Alias</th>
                  <th className="border-x border-border px-3 py-2.5 text-center font-semibold text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-muted-foreground">
                      <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                      <p>{clients.length === 0 ? 'Todavía no hay clientes cargados.' : 'No se encontraron clientes con esa búsqueda.'}</p>
                      {clients.length === 0 && canWrite && <Button size="sm" className="mt-4" onClick={openCreate}><Plus className="h-4 w-4" />Agregar el primer cliente</Button>}
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-border transition-colors hover:bg-muted/30">
                      <td className="border-x border-border px-3 py-2 font-medium text-foreground">{showValue(client.nombre)}</td>
                      <td className="border-x border-border px-3 py-2 text-muted-foreground">{showValue(client.apellido)}</td>
                      <td className="border-x border-border px-3 py-2 text-muted-foreground">{showValue(client.empresa)}</td>
                      <td className="border-x border-border px-3 py-2 text-muted-foreground">{showValue(client.direccion)}</td>
                      <td className="border-x border-border px-3 py-2 text-muted-foreground">{showValue(client.banco)}</td>
                      <td className="border-x border-border px-3 py-2 text-muted-foreground">{showValue(client.titularCuenta)}</td>
                      <td className="border-x border-border px-3 py-2 text-muted-foreground">{showValue(client.cuit)}</td>
                      <td className="border-x border-border px-3 py-2 font-mono text-xs text-muted-foreground">{showValue(client.cbu)}</td>
                      <td className="border-x border-border px-3 py-2 text-muted-foreground">{showValue(client.alias)}</td>
                      <td className="border-x border-border px-3 py-2 text-center">
                        {canWrite ? (
                          <div className="flex justify-center gap-1">
                            <Button size="icon-sm" variant="ghost" onClick={() => openEdit(client)} title="Editar cliente" aria-label="Editar cliente"><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon-sm" variant="ghost" onClick={() => setClientToDelete(client)} disabled={deletingId === client.id} title="Eliminar cliente" aria-label="Eliminar cliente"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={clientToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deletingId) setClientToDelete(null)
        }}
        title="Eliminar cliente"
        description={`Vas a eliminar a ${clientToDelete?.nombre || clientToDelete?.empresa || 'este cliente'}. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar cliente"
        loading={deletingId !== null}
        onConfirm={() => void remove()}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] max-w-3xl overflow-y-auto border-border/50 bg-card">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Editar cliente' : 'Agregar cliente'}</DialogTitle>
            <DialogDescription>Todos los campos son opcionales. Podés completar los datos bancarios cuando los necesites.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="client-name">Nombre</Label><Input id="client-name" value={draft.nombre} onChange={(event) => change('nombre', event.target.value)} maxLength={120} /></div>
            <div className="space-y-2"><Label htmlFor="client-last-name">Apellido</Label><Input id="client-last-name" value={draft.apellido} onChange={(event) => change('apellido', event.target.value)} maxLength={120} /></div>
            <div className="space-y-2"><Label htmlFor="client-company">Nombre de la empresa</Label><Input id="client-company" value={draft.empresa} onChange={(event) => change('empresa', event.target.value)} maxLength={160} /></div>
            <div className="space-y-2"><Label htmlFor="client-address">Dirección empresa / entrega</Label><Input id="client-address" value={draft.direccion} onChange={(event) => change('direccion', event.target.value)} maxLength={240} /></div>
            <div className="col-span-full border-t border-border/70 pt-4"><p className="text-sm font-semibold text-foreground">Cuenta bancaria</p><p className="mt-1 text-xs text-muted-foreground">Datos opcionales para identificar la cuenta al recibir cheques o transferencias.</p></div>
            <div className="space-y-2"><Label htmlFor="client-bank">Banco</Label><Input id="client-bank" value={draft.banco} onChange={(event) => change('banco', event.target.value)} maxLength={120} /></div>
            <div className="space-y-2"><Label htmlFor="client-account-owner">Titular de la cuenta</Label><Input id="client-account-owner" value={draft.titularCuenta} onChange={(event) => change('titularCuenta', event.target.value)} maxLength={160} /></div>
            <div className="space-y-2"><Label htmlFor="client-cuit">CUIT / CUIL</Label><Input id="client-cuit" value={draft.cuit} onChange={(event) => change('cuit', event.target.value)} maxLength={32} /></div>
            <div className="space-y-2"><Label htmlFor="client-cbu">CBU</Label><Input id="client-cbu" value={draft.cbu} onChange={(event) => change('cbu', event.target.value)} maxLength={32} inputMode="numeric" /></div>
            <div className="space-y-2"><Label htmlFor="client-alias">Alias</Label><Input id="client-alias" value={draft.alias} onChange={(event) => change('alias', event.target.value)} maxLength={120} /></div>
          </div>
          {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={() => void save()} disabled={saving}>{saving ? 'Guardando…' : 'Guardar cliente'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}