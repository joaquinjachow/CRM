import { NextResponse, type NextRequest } from 'next/server'
import { getCompanyContextForUser } from '@/lib/company-repository'
import { createSupabaseServerClient } from '@/lib/supabase/server'

function safeNextPath(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/'
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = safeNextPath(requestUrl.searchParams.get('next'))

  if (code) {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (user) await getCompanyContextForUser(user)
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  const loginUrl = new URL('/login', requestUrl.origin)
  loginUrl.searchParams.set('error', 'No se pudo validar el enlace. Pedí uno nuevo e intentá otra vez.')
  return NextResponse.redirect(loginUrl)
}
