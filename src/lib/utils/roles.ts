import type { UserRole } from '@/types'

export const SYSTEM_ROLES: UserRole[] = [
  'admin',
  'asset_manager',
  'finance',
  'auditor',
  'branch_manager',
  'maintenance_staff',
  'standard_staff',
]

const ROLE_ALIASES: Record<string, UserRole> = {
  admin: 'admin',
  primary_admin: 'admin',
  org_admin: 'admin',
  asset_manager: 'asset_manager',
  finance: 'finance',
  finance_user: 'finance',
  auditor: 'auditor',
  branch_manager: 'branch_manager',
  maintenance_staff: 'maintenance_staff',
  standard_staff: 'standard_staff',
}

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  primary_admin: 'Admin',
  org_admin: 'Admin',
  asset_manager: 'Asset Manager',
  finance: 'Finance',
  finance_user: 'Finance',
  auditor: 'Auditor',
  branch_manager: 'Branch Manager',
  maintenance_staff: 'Maintenance Staff',
  standard_staff: 'Standard Staff',
}

export function normalizeRole(value: unknown, fallback: UserRole = 'standard_staff'): UserRole {
  if (typeof value !== 'string') return fallback
  return ROLE_ALIASES[value] ?? fallback
}

export function roleLabel(value?: string | null): string {
  if (!value) return 'Team member'
  return ROLE_LABELS[value] ?? value.replace(/_/g, ' ')
}
