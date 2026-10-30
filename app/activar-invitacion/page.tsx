'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { AuthPage } from '@/components/auth-page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface InvitationDetails {
  email: string
  companyName: string
  role: string
}

export default function ActivateInvitationPage() {
  return (
    <Suspense fallback={<AuthPage title="Unite a la empresa" description="Validando el enlace de invitación."><p className="text-sm text-muted-foreground">Validando invitación…</p></AuthPage>}>
      <ActivateInvitationContent />
    </Suspense>
  )
}

function ActivateInvitationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const loginHref = useMemo(() => `/login?next=${encodeURIComponent(`/activar-invitacion?token=${token}`)}`, [token])
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadInvitation() {
      if (!token) {
        if (mounted) {
          setError('El enlace de invitación no es válido.')
          setLoading(false)
        }
        return
      }
      try {
        const [response, userResponse] = await Promise.all([
          fetch(`/api/invitations/accept?token=${encodeURIComponent(token)}`, { cache: 'no-store' }),
          createSupabaseBrowserClient().auth.getUser(),
        ])
        const body = await response.json() as InvitationDetails & { error?: string }
        if (!response.ok || !body.email || !body.companyName) throw new Error(body.error || 'No se pudo validar la invitación.')
        if (!mounted) return
        setInvitation(body)
        setCurrentUserEmail(userResponse.data.user?.email?.trim().toLowerCase() ?? '')
      } catch (requestError) {
        if (mounted) setError(requestError instanceof Error ? requestError.message : 'No se pudo validar la invitación.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadInvitation()
    return () => {
      mounted = false
    }
  }, [token])

  async function acceptWithExistingAccount() {
    setError('')
    setSubmitting(true)
    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acceptExisting', token }),
      })
      const body = await response.json() as { error?: string }
      if (!response.ok) throw new Error(body.error || 'No se pudo aceptar la invitación.')
      router.replace('/')
      router.refresh()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo aceptar la invitación.')
      setSubmitting(false)
    }
  }

  async function createAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const body = await response.json() as { email?: string; error?: string }
      if (!response.ok || !body.email) throw new Error(body.error || 'No se pudo crear la cuenta.')
      const { error: signInError } = await createSupabaseBrowserClient().auth.signInWithPassword({ email: body.email, password })
      if (signInError) throw new Error('La cuenta fue creada, pero no se pudo iniciar sesión. Ingresá con el correo y la contraseña elegidos.')
      router.replace('/')
      router.refresh()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo crear la cuenta.')
      setSubmitting(false)
    }
  }

  const hasAnotherSession = currentUserEmail && invitation && currentUserEmail !== invitation.email

  return (
    <AuthPage title="Unite a la empresa" description={invitation ? `Vas a ingresar a ${invitation.companyName} con el acceso que te asignaron.` : 'Validando el enlace de invitación.'}>
      {loading ? (
        <p className="text-sm text-muted-foreground">Validando invitación…</p>
      ) : error && !invitation ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : invitation ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-border/70 bg-muted/25 px-3 py-3 text-sm">
            <p className="font-medium text-foreground">{invitation.email}</p>
            <p className="mt-1 text-muted-foreground">El enlace sólo puede crear o vincular una cuenta con este correo.</p>
          </div>
          {hasAnotherSession ? (
            <div className="space-y-3 rounded-lg bg-destructive/10 px-3 py-3 text-sm text-destructive">
              <p>Estás conectado como {currentUserEmail}. Para aceptar esta invitación, ingresá con {invitation.email}.</p>
              <Link href={loginHref} className="font-medium underline">Cambiar de cuenta</Link>
            </div>
          ) : currentUserEmail ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Ya ingresaste con el correo invitado. Confirmá para unir esta cuenta a la empresa.</p>
              {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
              <Button type="button" className="w-full" onClick={() => void acceptWithExistingAccount()} disabled={submitting}>
                {submitting ? 'Uniendo cuenta…' : 'Aceptar invitación'}
              </Button>
            </div>
          ) : (
            <form onSubmit={createAccount} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invitation-password">Elegí una contraseña</Label>
                <Input id="invitation-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invitation-password-confirm">Repetir contraseña</Label>
                <Input id="invitation-password-confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} />
              </div>
              {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Creando cuenta…' : 'Crear cuenta y unirme'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                ¿Ya tenés una cuenta? <Link href={loginHref} className="font-medium text-primary hover:underline">Ingresar para aceptar</Link>
              </p>
            </form>
          )}
        </div>
      ) : null}
    </AuthPage>
  )
}