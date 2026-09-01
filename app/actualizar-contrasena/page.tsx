'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AuthPage } from '@/components/auth-page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    setLoading(true)
    const { error: updateError } = await createSupabaseBrowserClient().auth.updateUser({ password })
    if (updateError) {
      setError('El enlace no es válido o venció. Pedí uno nuevo e intentá otra vez.')
      setLoading(false)
      return
    }

    router.replace('/')
    router.refresh()
  }

  return (
    <AuthPage title="Nueva contraseña" description="Elegí una contraseña segura para tu cuenta.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nueva contraseña</Label>
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Repetir contraseña</Label>
          <Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} />
        </div>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Guardando…' : 'Guardar contraseña'}
        </Button>
      </form>
    </AuthPage>
  )
}