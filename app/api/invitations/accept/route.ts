import { NextResponse, type NextRequest } from 'next/server'
import { acceptCompanyInvitationForUser, acceptCompanyInvitationWithPassword, CompanyRepositoryError, getCompanyInvitationForActivation } from '@/lib/company-repository'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'No se pudo procesar la invitación.'
  const status = error instanceof CompanyRepositoryError ? 400 : 503
  return NextResponse.json({ error: message }, { status })
}

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return error ? null : user
}

export async function GET(request: NextRequest) {
  try {
    const invitation = await getCompanyInvitationForActivation(request.nextUrl.searchParams.get('token'))
    return NextResponse.json(invitation)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json() as { token?: unknown; password?: unknown; action?: unknown }
    if (input.action === 'acceptExisting') {
      const user = await getAuthenticatedUser()
      if (!user) return NextResponse.json({ error: 'Ingresá con tu cuenta para aceptar la invitación.' }, { status: 401 })
      await acceptCompanyInvitationForUser(input.token, user)
      return NextResponse.json({ accepted: true })
    }
    const result = await acceptCompanyInvitationWithPassword({ token: input.token, password: input.password })
    return NextResponse.json({ created: true, email: result.email })
  } catch (error) {
    return errorResponse(error)
  }
}