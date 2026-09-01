'use client'

import { useEffect, useState } from 'react'
import { PageShell } from '@/components/page-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { defaultPermissionsByRole, permissionGroups, permissionLabels, roleLabel, type CompanyMember, type CompanyPermission, type CompanyRole } from '@/lib/company'
import { useCompany } from '@/lib/company-context'
import { Check, Crown, Eye, ShieldCheck, SlidersHorizontal, UserPlus, Users, Wrench } from 'lucide-react'

type EditableRole = Exclude<CompanyRole, 'owner'>

const editableRoles: EditableRole[] = ['admin', 'operator', 'viewer', 'custom']

const roleDetails: Record<CompanyRole, { description: string; icon: typeof Crown }> = {
  owner: {
    description: 'Control total de la empresa, incluidos usuarios, permisos y nombre.',
    icon: Crown,
  },
  admin: {
    description: 'Acceso operativo completo, sin acceso a usuarios ni roles.',
    icon: ShieldCheck,
  },
  operator: {
    description: 'Puede trabajar con stock, pedidos, facturas, caja y equipamiento; no administra usuarios ni costo/km.',
    icon: Wrench,
  },
  viewer: {
    description: 'Puede consultar y exportar la información, pero no crear, modificar ni cancelar registros.',
    icon: Eye,
  },
  custom: {
    description: 'Permite elegir sección por sección qué puede ver o modificar, sin administrar usuarios.',
    icon: SlidersHorizontal,
  },
}

function PermissionEditor({ permissions, onChange, disabled }: { permissions: CompanyPermission[]; onChange: (permissions: CompanyPermission[]) => void; disabled?: boolean }) {
  function toggle(permission: CompanyPermission) {
    onChange(permissions.includes(permission)
      ? permissions.filter((item) => item !== permission)
      : [...permissions, permission])
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
      <div className="border-b border-border/70 bg-muted/30 px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Permisos personalizados</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Elegí exactamente qué puede consultar o modificar esta persona.</p>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2">
        {permissionGroups.filter((group) => group.key !== 'users').map((group) => (
          <div key={group.key} className="rounded-lg border border-border/60 bg-muted/15 p-3">
            <p className="mb-2.5 text-sm font-medium text-foreground">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.permissions.map((permission) => {
                const selected = permissions.includes(permission)
                return (
                  <label
                    key={permission}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      selected
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : 'border-border/70 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <input type="checkbox" checked={selected} onChange={() => toggle(permission)} disabled={disabled} className="sr-only" />
                    <span className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'}`}>
                      {selected && <Check className="h-3 w-3" />}
                    </span>
                    {permissionLabels[permission]}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border/70 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        Usuarios y roles siempre los administra exclusivamente el Propietario.
      </div>
    </div>
  )
}

function RoleSelector({ id, role, onChange, disabled }: { id?: string; role: EditableRole; onChange: (role: EditableRole) => void; disabled?: boolean }) {
  return (
    <Select
      value={role}
      onValueChange={(value) => onChange(value as EditableRole)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full min-w-56 bg-card">
        <SelectValue aria-label="Rol" />
      </SelectTrigger>
      <SelectContent className="min-w-56">
        {editableRoles.map((item) => <SelectItem key={item} value={item}>{roleLabel(item)}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function RoleGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Cómo funcionan los roles</CardTitle>
        <CardDescription>El acceso siempre aplica a los datos compartidos de esta empresa. Elegí el rol según la tarea de cada persona.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {(Object.keys(roleDetails) as CompanyRole[]).map((role) => {
          const Icon = roleDetails[role].icon
          return (
            <div key={role} className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
                <p className="text-sm font-medium text-foreground">{roleLabel(role)}</p>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{roleDetails[role].description}</p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function MemberAccess({ member, onSaved }: { member: CompanyMember; onSaved: (members: CompanyMember[]) => void }) {
  const [role, setRole] = useState<EditableRole>(member.role === 'owner' ? 'admin' : member.role)
  const [permissions, setPermissions] = useState<CompanyPermission[]>(member.permissions)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (member.role !== 'owner') setRole(member.role)
    setPermissions(member.permissions)
    setError('')
  }, [member])

  function changeRole(nextRole: EditableRole) {
    setRole(nextRole)
    setPermissions([...defaultPermissionsByRole[nextRole]])
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateMember', userId: member.userId, role, permissions }),
      })
      const body = await response.json() as { members?: CompanyMember[]; error?: string }
      if (!response.ok || !body.members) throw new Error(body.error || 'No se pudo actualizar el usuario.')
      onSaved(body.members)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo actualizar el usuario.')
    } finally {
      setSaving(false)
    }
  }

  if (member.role === 'owner') {
    return <Badge>Propietario de la empresa</Badge>
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <RoleSelector role={role} onChange={changeRole} disabled={saving} />
        <span className="text-sm text-muted-foreground">{permissions.length} permiso{permissions.length === 1 ? '' : 's'}</span>
      </div>
      {role === 'custom' && <PermissionEditor permissions={permissions} onChange={setPermissions} disabled={saving} />}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button size="sm" variant="outline" onClick={() => void save()} disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar acceso'}
      </Button>
    </div>
  )
}

export default function UsersPage() {
  const { company, member, members, loading, error: companyError, can, refresh, setMembers } = useCompany()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<EditableRole>('operator')
  const [permissions, setPermissions] = useState<CompanyPermission[]>([...defaultPermissionsByRole.operator])
  const [companyName, setCompanyName] = useState('')
  const [companyNameSaving, setCompanyNameSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const canManageUsers = can('users:manage')

  useEffect(() => {
    setCompanyName(company?.name ?? '')
  }, [company])

  function changeRole(nextRole: EditableRole) {
    setRole(nextRole)
    setPermissions([...defaultPermissionsByRole[nextRole]])
  }

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')
    setSubmitting(true)
    try {
      const response = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invite', email, role, permissions }),
      })
      const body = await response.json() as { members?: CompanyMember[]; error?: string }
      if (!response.ok || !body.members) throw new Error(body.error || 'No se pudo enviar la invitación.')
      setMembers(body.members)
      setEmail('')
      setMessage('Invitación enviada. La persona recibirá un correo para definir su contraseña.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo enviar la invitación.')
    } finally {
      setSubmitting(false)
    }
  }

  async function saveCompanyName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setCompanyNameSaving(true)
    try {
      const response = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateCompanyName', name: companyName }),
      })
      const body = await response.json() as { error?: string }
      if (!response.ok) throw new Error(body.error || 'No se pudo actualizar el nombre de la empresa.')
      await refresh()
      setMessage('Nombre de empresa actualizado.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo actualizar el nombre de la empresa.')
    } finally {
      setCompanyNameSaving(false)
    }
  }

  return (
    <PageShell>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Usuarios</h1>
          <p className="mt-1 text-muted-foreground">
            {company ? `Accesos de ${company.name}. Los datos operativos se comparten sólo dentro de esta empresa.` : 'Administrá quién puede ingresar al CRM.'}
          </p>
        </div>
        <Badge variant="outline" className="gap-2 px-3 py-1.5"><ShieldCheck className="h-4 w-4" />Empresa única</Badge>
      </div>

      {loading ? (
        <Card><CardContent className="py-10 text-sm text-muted-foreground">Cargando empresa y usuarios…</CardContent></Card>
      ) : !canManageUsers ? (
        <Card><CardContent className="py-10 text-sm text-muted-foreground">No tenés permiso para administrar usuarios. Pedile a un propietario o administrador que ajuste tu acceso.</CardContent></Card>
      ) : (
        <div className="space-y-6">
          <RoleGuide />
          {member?.role === 'owner' && (
            <Card>
              <CardHeader>
                <CardTitle>Empresa</CardTitle>
                <CardDescription>Este nombre identifica el espacio compartido por todos sus usuarios.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveCompanyName} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Label htmlFor="company-name">Nombre de la empresa</Label>
                    <Input id="company-name" value={companyName} onChange={(event) => setCompanyName(event.target.value)} required maxLength={120} />
                  </div>
                  <Button type="submit" variant="outline" disabled={companyNameSaving}>{companyNameSaving ? 'Guardando…' : 'Guardar nombre'}</Button>
                </form>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" />Invitar usuario</CardTitle>
                <CardDescription>Se crea una cuenta vinculada a esta empresa. El invitado define su propia contraseña desde el correo.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={invite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Correo electrónico</Label>
                  <Input id="invite-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Rol</Label>
                  <div><RoleSelector id="invite-role" role={role} onChange={changeRole} disabled={submitting} /></div>
                  <p className="text-xs text-muted-foreground">{roleDetails[role].description}</p>
                </div>
                {role === 'custom' && <PermissionEditor permissions={permissions} onChange={setPermissions} disabled={submitting} />}
                {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
                {message && <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{message}</p>}
                <Button type="submit" className="w-full" disabled={submitting}>
                  <UserPlus className="h-4 w-4" />{submitting ? 'Enviando…' : 'Enviar invitación'}
                </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Personas con acceso</CardTitle>
              <CardDescription>El Propietario puede cambiar el rol o definir permisos personalizados en cualquier momento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {companyError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{companyError}</p>}
              {members.map((member) => (
                <div key={member.userId} className="rounded-xl border border-border/70 p-4">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-foreground">{member.email}</p>
                      <p className="text-sm text-muted-foreground">{roleLabel(member.role)}</p>
                    </div>
                    <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>{roleLabel(member.role)}</Badge>
                  </div>
                  <MemberAccess member={member} onSaved={setMembers} />
                </div>
              ))}
              {members.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Todavía no hay usuarios en la empresa.</p>}
            </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PageShell>
  )
}
