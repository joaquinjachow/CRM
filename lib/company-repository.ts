import 'server-only'
import type { User } from '@supabase/supabase-js'
import { allPermissions, defaultPermissionsByRole, hasCompanyPermission, isCompanyRole, normalizePermissions, type Company, type CompanyContextValue, type CompanyMember, type CompanyPermission, type CompanyRole } from './company'
import { getSupabaseAdmin } from './supabase'

export class CompanyRepositoryError extends Error {}

type MembershipRow = {
  company_id: string
  user_id: string
  email: string
  role: string
  permissions: unknown
  created_at: string
}

type CompanyRow = {
  id: string
  name: string
}

function memberFromRow(row: MembershipRow): CompanyMember {
  if (!isCompanyRole(row.role)) throw new CompanyRepositoryError('La membresía de la empresa tiene un rol inválido.')
  return {
    companyId: row.company_id,
    userId: row.user_id,
    email: row.email,
    role: row.role,
    permissions: normalizePermissions(row.permissions),
    createdAt: row.created_at,
  }
}

function companyNameFor(user: User) {
  const metadataName = user.user_metadata?.company_name
  const name = typeof metadataName === 'string' ? metadataName.trim() : ''
  return name.slice(0, 120) || 'Mi empresa'
}

function emailFor(user: User) {
  const email = user.email?.trim().toLowerCase()
  if (!email) throw new CompanyRepositoryError('La cuenta no tiene un correo electrónico válido.')
  return email
}

async function getCompanyById(companyId: string): Promise<Company> {
  const { data, error } = await getSupabaseAdmin()
    .from('companies')
    .select('id, name')
    .eq('id', companyId)
    .maybeSingle<CompanyRow>()
  if (error) throw new CompanyRepositoryError(`No se pudo leer la empresa: ${error.message}`)
  if (!data) throw new CompanyRepositoryError('La empresa asociada al usuario ya no existe.')
  return { id: data.id, name: data.name }
}

async function getMembershipForUser(userId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('company_memberships')
    .select('company_id, user_id, email, role, permissions, created_at')
    .eq('user_id', userId)
    .maybeSingle<MembershipRow>()
  if (error) throw new CompanyRepositoryError(`No se pudo validar el acceso a la empresa: ${error.message}`)
  return data ? memberFromRow(data) : null
}

async function createFirstCompanyForUser(user: User): Promise<CompanyContextValue> {
  const admin = getSupabaseAdmin()
  const email = emailFor(user)
  const { data: created, error: createError } = await admin
    .from('companies')
    .insert({ name: companyNameFor(user), owner_user_id: user.id })
    .select('id, name')
    .single<CompanyRow>()

  let company: Company
  if (createError) {
    const { data: existing, error: existingError } = await admin
      .from('companies')
      .select('id, name')
      .eq('owner_user_id', user.id)
      .maybeSingle<CompanyRow>()
    if (existingError || !existing) {
      throw new CompanyRepositoryError(`No se pudo crear la empresa: ${createError.message}`)
    }
    company = { id: existing.id, name: existing.name }
  } else {
    company = { id: created.id, name: created.name }
  }

  const ownerPermissions = defaultPermissionsByRole.owner
  const { error: memberError } = await admin
    .from('company_memberships')
    .upsert({
      company_id: company.id,
      user_id: user.id,
      email,
      role: 'owner',
      permissions: ownerPermissions,
    }, { onConflict: 'user_id' })
  if (memberError) throw new CompanyRepositoryError(`No se pudo asignar el acceso a la empresa: ${memberError.message}`)

  const [{ error: stateError }, { error: settingsError }] = await Promise.all([
    admin.from('company_crm_state').upsert({ company_id: company.id }, { onConflict: 'company_id' }),
    admin.from('company_settings').upsert({ company_id: company.id }, { onConflict: 'company_id' }),
  ])
  if (stateError || settingsError) {
    throw new CompanyRepositoryError(`No se pudo preparar la empresa: ${stateError?.message || settingsError?.message}`)
  }
  const member = await getMembershipForUser(user.id)
  if (!member) throw new CompanyRepositoryError('No se pudo completar el acceso a la empresa.')
  return { company, member }
}

export async function getCompanyContextForUser(user: User): Promise<CompanyContextValue> {
  const membership = await getMembershipForUser(user.id)
  if (membership) return { company: await getCompanyById(membership.companyId), member: membership }
  return createFirstCompanyForUser(user)
}

export async function listCompanyMembers(companyId: string): Promise<CompanyMember[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('company_memberships')
    .select('company_id, user_id, email, role, permissions, created_at')
    .eq('company_id', companyId)
    .order('created_at')
  if (error) throw new CompanyRepositoryError(`No se pudieron listar los usuarios: ${error.message}`)
  return (data as MembershipRow[] ?? []).map(memberFromRow)
}

function assertCanManageUsers(context: CompanyContextValue) {
  if (context.member.role !== 'owner') {
    throw new CompanyRepositoryError('Sólo el propietario puede administrar los usuarios y roles de la empresa.')
  }
}

export async function inviteCompanyMember(context: CompanyContextValue, input: { email: unknown; role: unknown; permissions: unknown; redirectTo: string }) {
  assertCanManageUsers(context)
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new CompanyRepositoryError('Ingresá un correo electrónico válido.')
  if (!isCompanyRole(input.role) || input.role === 'owner') throw new CompanyRepositoryError('Elegí un rol válido para el usuario.')
  const permissions = input.role === 'custom'
    ? normalizePermissions(input.permissions)
    : defaultPermissionsByRole[input.role]
  const { data, error } = await getSupabaseAdmin().auth.admin.inviteUserByEmail(email, {
    redirectTo: input.redirectTo,
  })
  if (error || !data.user) throw new CompanyRepositoryError(error?.message || 'No se pudo enviar la invitación.')
  const { error: membershipError } = await getSupabaseAdmin()
    .from('company_memberships')
    .insert({
      company_id: context.company.id,
      user_id: data.user.id,
      email,
      role: input.role,
      permissions,
    })
  if (membershipError) throw new CompanyRepositoryError(`La invitación se creó, pero no se pudo asignar a la empresa: ${membershipError.message}`)
  return listCompanyMembers(context.company.id)
}

export async function updateCompanyMemberAccess(context: CompanyContextValue, input: { userId: unknown; role: unknown; permissions: unknown }) {
  assertCanManageUsers(context)
  const userId = typeof input.userId === 'string' ? input.userId : ''
  if (!userId) throw new CompanyRepositoryError('Indicá el usuario que querés actualizar.')
  if (!isCompanyRole(input.role) || input.role === 'owner') throw new CompanyRepositoryError('El rol indicado no se puede asignar.')
  const members = await listCompanyMembers(context.company.id)
  const target = members.find((member) => member.userId === userId)
  if (!target) throw new CompanyRepositoryError('El usuario no pertenece a esta empresa.')
  if (target.role === 'owner') throw new CompanyRepositoryError('El propietario no puede modificarse desde este panel.')
  const permissions = input.role === 'custom'
    ? normalizePermissions(input.permissions)
    : defaultPermissionsByRole[input.role]
  const { error } = await getSupabaseAdmin()
    .from('company_memberships')
    .update({ role: input.role, permissions })
    .eq('company_id', context.company.id)
    .eq('user_id', userId)
  if (error) throw new CompanyRepositoryError(`No se pudo actualizar el acceso: ${error.message}`)
  return listCompanyMembers(context.company.id)
}

export async function updateCompanyName(context: CompanyContextValue, value: unknown) {
  if (context.member.role !== 'owner') throw new CompanyRepositoryError('Sólo el propietario puede cambiar el nombre de la empresa.')
  const name = typeof value === 'string' ? value.trim().slice(0, 120) : ''
  if (!name) throw new CompanyRepositoryError('Ingresá un nombre de empresa válido.')
  const { data, error } = await getSupabaseAdmin()
    .from('companies')
    .update({ name })
    .eq('id', context.company.id)
    .select('id, name')
    .single<CompanyRow>()
  if (error || !data) throw new CompanyRepositoryError(`No se pudo actualizar la empresa: ${error?.message || 'sin respuesta'}`)
  return { id: data.id, name: data.name }
}

export async function getCompanyFreightCost(companyId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('company_settings')
    .select('freight_cost_per_km')
    .eq('company_id', companyId)
    .maybeSingle<{ freight_cost_per_km: number }>()
  if (error) throw new CompanyRepositoryError(`No se pudo leer el costo por km: ${error.message}`)
  return Number(data?.freight_cost_per_km ?? 0)
}

export async function updateCompanyFreightCost(context: CompanyContextValue, value: number) {
  if (!hasCompanyPermission(context.member, 'settings:manage')) {
    throw new CompanyRepositoryError('No tenés permiso para cambiar el costo por km de la empresa.')
  }
  if (!Number.isFinite(value) || value < 0) throw new CompanyRepositoryError('Indicá un costo por km válido.')
  const { error } = await getSupabaseAdmin()
    .from('company_settings')
    .upsert({ company_id: context.company.id, freight_cost_per_km: value }, { onConflict: 'company_id' })
  if (error) throw new CompanyRepositoryError(`No se pudo guardar el costo por km: ${error.message}`)
  return value
}

export function canUseCompanyPermission(context: CompanyContextValue, permission: CompanyPermission) {
  return hasCompanyPermission(context.member, permission)
}

export const companyPermissions = allPermissions
