import { useAuthStore } from '@/lib/stores/auth'
import { normalizeRole } from '@/lib/utils/roles'
import type { UserRole } from '@/types'

export type Permission =
  | 'assets.create'
  | 'assets.edit'
  | 'assets.delete'
  | 'assets.transfer'
  | 'assets.dispose'
  | 'assets.restore'
  | 'assets.import'
  | 'assets.export'
  | 'assets.view.financial'
  | 'branches.create'
  | 'branches.edit'
  | 'branches.delete'
  | 'maintenance.create'
  | 'maintenance.complete'
  | 'maintenance.assign'
  | 'depreciation.record'
  | 'depreciation.edit'
  | 'disposal.approve'
  | 'reports.finance'
  | 'reports.audit'
  | 'settings.manage'
  | 'team.manage'
  | 'recognition.override'

const permissionMatrix: Record<Permission, UserRole[]> = {
  'assets.create':        ['admin','asset_manager','branch_manager'],
  'assets.edit':          ['admin','asset_manager','branch_manager'],
  'assets.delete':        ['admin','asset_manager'],
  'assets.transfer':      ['admin','asset_manager','branch_manager'],
  'assets.dispose':       ['admin','asset_manager'],
  'assets.restore':       ['admin','asset_manager'],
  'assets.import':        ['admin','asset_manager'],
  'assets.export':        ['admin','asset_manager','finance','auditor'],
  'assets.view.financial':['admin','asset_manager','finance','auditor'],
  'branches.create':      ['admin','asset_manager'],
  'branches.edit':        ['admin','asset_manager','branch_manager'],
  'branches.delete':      ['admin','asset_manager'],
  'maintenance.create':   ['admin','asset_manager','branch_manager','maintenance_staff'],
  'maintenance.complete': ['admin','asset_manager','branch_manager','maintenance_staff'],
  'maintenance.assign':   ['admin','asset_manager','branch_manager'],
  'depreciation.record':  ['admin','asset_manager','finance'],
  'depreciation.edit':    ['admin','finance'],
  'disposal.approve':     ['admin','finance'],
  'reports.finance':      ['admin','finance','auditor'],
  'reports.audit':        ['admin','asset_manager','finance','auditor'],
  'settings.manage':      ['admin'],
  'team.manage':          ['admin'],
  'recognition.override': ['admin','finance'],
}

export function can(role: UserRole, permission: Permission): boolean {
  return permissionMatrix[permission]?.includes(normalizeRole(role)) ?? false
}

export function usePermission() {
  const rawRole = useAuthStore((s) => s.role)
  const role = normalizeRole(rawRole, 'standard_staff')
  return {
    can: (permission: Permission) => can(role, permission),
    role,
  }
}
