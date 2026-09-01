import { NextResponse } from 'next/server'
import { CompanyRepositoryError, getCompanyContextForUser, getCompanyFreightCost, updateCompanyFreightCost } from '@/lib/company-repository'
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
  const message = error instanceof Error ? error.message : 'No se pudo procesar la configuración.'
  const status = error instanceof CompanyRepositoryError ? 400 : 503
  return NextResponse.json({ error: message }, { status })
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    const context = await getCompanyContextForUser(user)
    if (!hasCompanyPermission(context.member, 'freight:view')) {
      return NextResponse.json({ error: 'No tenés permiso para usar el cálculo de flete.' }, { status: 403 })
    }
    return NextResponse.json({ freightCostPerKm: await getCompanyFreightCost(context.company.id), canEdit: hasCompanyPermission(context.member, 'settings:manage') })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    const context = await getCompanyContextForUser(user)
    const body = await request.json() as { freightCostPerKm?: unknown }
    const value = typeof body.freightCostPerKm === 'number' ? body.freightCostPerKm : Number(body.freightCostPerKm)
    return NextResponse.json({ freightCostPerKm: await updateCompanyFreightCost(context, value) })
  } catch (error) {
    return errorResponse(error)
  }
}
