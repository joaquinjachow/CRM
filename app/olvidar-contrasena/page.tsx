'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AuthPage } from '@/components/auth-page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const redirectTo = new URL('/auth/callback', window.location.origin)
    redirectTo.searchParams.set('next', '/actualizar-contrasena')
    const { error: resetError } = await createSupabaseBrowserClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectTo.toString(),
    })

    if (resetError) {
      setError(resetError.message)
    } else {
      setMessage('Si existe una cuenta con ese correo, vas a recibir un enlace para cambiar la contraseña.')
    }
    setLoading(false)
  }

  return (
    <AuthPage title="Recuperar contraseña" description="Te enviaremos un enlace para que puedas crear una nueva.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{message}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Enviando…' : 'Enviar enlace'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">Volver al ingreso</Link>
      </p>
    </AuthPage>
  )
}
