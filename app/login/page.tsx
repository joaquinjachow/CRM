'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AuthPage } from '@/components/auth-page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

function safeNextPath(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/'
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setError(new URLSearchParams(window.location.search).get('error') ?? '')
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const { error: loginError } = await createSupabaseBrowserClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (loginError) {
      setError('El correo o la contraseña no son correctos.')
      setLoading(false)
      return
    }

    router.replace(safeNextPath(new URLSearchParams(window.location.search).get('next')))
    router.refresh()
  }

  return (
    <AuthPage title="Ingresar al CRM" description="Usá tu correo y contraseña para continuar.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Contraseña</Label>
            <Link href="/olvidar-contrasena" className="text-sm font-medium text-primary hover:underline">
              ¿La olvidaste?
            </Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </div>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Todavía no tenés usuario?{' '}
        <Link href="/registrarse" className="font-medium text-primary hover:underline">Registrarse</Link>
      </p>
    </AuthPage>
  )
}
