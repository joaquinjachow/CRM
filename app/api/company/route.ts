import { NextResponse } from 'next/server'
import { CompanyRepositoryError, getCompanyContextForUser, inviteCompanyMember, listCompanyMembers, updateCompanyMemberAccess, updateCompanyName } from '@/lib/company-repository'
import { hasCompanyPermission } from '@/lib/company'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return error ? null : user
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'No se pudo procesar la empresa.'
  const status = error instanceof CompanyRepositoryError ? 400 : 503
  return NextResponse.json({ error: message }, { status })
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    const context = await getCompanyContextForUser(user)
    const members = hasCompanyPermission(context.member, 'users:manage')
      ? await listCompanyMembers(context.company.id)
      : undefined
    return NextResponse.json({ ...context, members })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    const context = await getCompanyContextForUser(user)
    const input = await request.json() as Record<string, unknown>
    const action = input.action
    const origin = new URL(request.url).origin
    const redirectTo = `${origin}/auth/callback?next=/actualizar-contrasena`
    if (action === 'invite') {
      return NextResponse.json({ members: await inviteCompanyMember(context, { email: input.email, role: input.role, permissions: input.permissions, redirectTo }) })
    }
    if (action === 'updateMember') {
      return NextResponse.json({ members: await updateCompanyMemberAccess(context, { userId: input.userId, role: input.role, permissions: input.permissions }) })
    }
    if (action === 'updateCompanyName') {
      return NextResponse.json({ company: await updateCompanyName(context, input.name) })
    }
    throw new CompanyRepositoryError('La acción indicada no es válida.')
  } catch (error) {
    return errorResponse(error)
  }
}
