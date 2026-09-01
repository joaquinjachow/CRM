export const permissionGroups = [
  { key: 'dashboard', label: 'Inicio', permissions: ['dashboard:view'] },
  { key: 'freight', label: 'Calcular flete', permissions: ['freight:view', 'settings:manage'] },
  { key: 'stock', label: 'Stock e ingresos', permissions: ['stock:view', 'stock:write'] },
  { key: 'quotes', label: 'Presupuestos', permissions: ['quotes:view', 'quotes:write'] },
  { key: 'orders', label: 'Pedidos', permissions: ['orders:view', 'orders:write'] },
  { key: 'billing', label: 'Facturación', permissions: ['billing:view', 'billing:write'] },
  { key: 'equipment', label: 'Equipamiento', permissions: ['equipment:view', 'equipment:write'] },
  { key: 'finance', label: 'Caja, cheques y pagos', permissions: ['finance:view', 'finance:write'] },
  { key: 'users', label: 'Usuarios y permisos', permissions: ['users:manage'] },
] as const

export const permissionLabels: Record<string, string> = {
  'dashboard:view': 'Ver',
  'freight:view': 'Usar',
  'settings:manage': 'Cambiar costo/km',
  'stock:view': 'Ver',
  'stock:write': 'Crear y editar',
  'quotes:view': 'Ver',
  'quotes:write': 'Crear',
  'orders:view': 'Ver',
  'orders:write': 'Crear y cancelar',
  'billing:view': 'Ver',
  'billing:write': 'Crear y actualizar',
  'equipment:view': 'Ver',
  'equipment:write': 'Crear y editar',
  'finance:view': 'Ver',
  'finance:write': 'Registrar y actualizar',
  'users:manage': 'Invitar y administrar',
}

export const allPermissions = permissionGroups.flatMap((group) => group.permissions)

export type CompanyPermission = (typeof allPermissions)[number]
export type CompanyRole = 'owner' | 'admin' | 'operator' | 'viewer' | 'custom'

export interface Company {
  id: string
  name: string
}

export interface CompanyMember {
  companyId: string
  userId: string
  email: string
  role: CompanyRole
  permissions: CompanyPermission[]
  createdAt: string
}

export interface CompanyContextValue {
  company: Company
  member: CompanyMember
}

const viewPermissions = allPermissions.filter((permission) => permission.endsWith(':view'))
const adminPermissions = allPermissions.filter((permission) => permission !== 'users:manage')
const operatorPermissions = allPermissions.filter((permission) => permission !== 'users:manage' && permission !== 'settings:manage')

export const defaultPermissionsByRole: Record<CompanyRole, CompanyPermission[]> = {
  owner: [...allPermissions],
  admin: adminPermissions,
  operator: operatorPermissions,
  viewer: viewPermissions,
  custom: [],
}

export function isCompanyRole(value: unknown): value is CompanyRole {
  return typeof value === 'string' && ['owner', 'admin', 'operator', 'viewer', 'custom'].includes(value)
}

export function normalizePermissions(value: unknown): CompanyPermission[] {
  if (!Array.isArray(value)) return []
  const allowed = new Set(allPermissions)
  return [...new Set(value.filter((permission): permission is CompanyPermission => typeof permission === 'string' && allowed.has(permission as CompanyPermission)))]
}

export function hasCompanyPermission(member: Pick<CompanyMember, 'role' | 'permissions'>, permission: CompanyPermission) {
  if (permission === 'users:manage') return member.role === 'owner'
  return member.role === 'owner' || member.permissions.includes(permission)
}

export function roleLabel(role: CompanyRole) {
  return {
    owner: 'Propietario',
    admin: 'Administrador',
    operator: 'Operador',
    viewer: 'Solo consulta',
    custom: 'Personalizado',
  }[role]
}
