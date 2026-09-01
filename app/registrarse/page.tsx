'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AuthPage } from '@/components/auth-page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const emailRedirectTo = new URL('/auth/callback', window.location.origin)
    emailRedirectTo.searchParams.set('next', '/')
    const { data, error: signUpError } = await createSupabaseBrowserClient().auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: emailRedirectTo.toString(),
        data: { company_name: companyName.trim() },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.session) {
      router.replace('/')
      router.refresh()
      return
    }

    setMessage('Te enviamos un correo para confirmar tu cuenta. Abrilo y después vas a poder ingresar al CRM.')
    setLoading(false)
  }

  return (
    <AuthPage title="Crear empresa" description="Creá la empresa y la cuenta administradora del CRM.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="company-name">Nombre de la empresa</Label>
          <Input id="company-name" autoComplete="organization" value={companyName} onChange={(event) => setCompanyName(event.target.value)} required maxLength={120} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Repetir contraseña</Label>
          <Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} />
        </div>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{message}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creando empresa…' : 'Crear empresa'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tenés usuario?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">Ingresar</Link>
      </p>
    </AuthPage>
  )
}
