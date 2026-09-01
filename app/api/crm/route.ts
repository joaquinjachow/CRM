import { NextResponse } from 'next/server'
import { getCompanyContextForUser } from '@/lib/company-repository'
import { hasCompanyPermission, type CompanyPermission } from '@/lib/company'
import { CrmRepositoryError, getCrmState, getMutationRequiredPermission, getVisibleCrmState, mutateCrmState, type MutationInput } from '@/lib/crm-repository'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const resourcePermissions: Record<string, CompanyPermission> = {
  dashboard: 'dashboard:view',
  freight: 'freight:view',
  stock: 'stock:view',
  quotes: 'quotes:view',
  orders: 'orders:view',
  billing: 'billing:view',
  equipment: 'equipment:view',
  finance: 'finance:view',
}

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return error ? null : user
}

function responseForError(error: unknown) {
  const message = error instanceof Error ? error.message : 'No se pudo conectar con la base de datos.'
  const status = error instanceof CrmRepositoryError ? 400 : 503
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    const context = await getCompanyContextForUser(user)
    const resource = new URL(request.url).searchParams.get('resource') || 'dashboard'
    const requiredPermission = resourcePermissions[resource]
    if (!requiredPermission) return NextResponse.json({ error: 'El recurso solicitado no existe.' }, { status: 400 })
    if (!hasCompanyPermission(context.member, requiredPermission)) {
      return NextResponse.json({ error: 'No tenés permiso para ver esta sección.' }, { status: 403 })
    }
    const state = await getCrmState(context.company.id)
    return NextResponse.json({
      state: getVisibleCrmState(state, context.member),
      company: context.company,
      member: context.member,
    })
  } catch (error) {
    return responseForError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    const context = await getCompanyContextForUser(user)
    const input = await request.json() as unknown
    const requiredPermission = getMutationRequiredPermission(input)
    if (!hasCompanyPermission(context.member, requiredPermission)) {
      return NextResponse.json({ error: 'No tenés permiso para realizar esta acción.' }, { status: 403 })
    }
    const result = await mutateCrmState(context.company.id, input as MutationInput)
    return NextResponse.json({ ...result, state: getVisibleCrmState(result.state, context.member) })
  } catch (error) {
    return responseForError(error)
  }
}
