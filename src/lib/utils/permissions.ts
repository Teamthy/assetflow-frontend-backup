import { useAuthStore } from '@/lib/stores/auth'
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
  'assets.create':        ['primary_admin','org_admin','asset_manager','branch_manager'],
  'assets.edit':          ['primary_admin','org_admin','asset_manager','branch_manager'],
  'assets.delete':        ['primary_admin','org_admin','asset_manager'],
  'assets.transfer':      ['primary_admin','org_admin','asset_manager','branch_manager'],
  'assets.dispose':       ['primary_admin','org_admin','asset_manager'],
  'assets.restore':       ['primary_admin','org_admin','asset_manager'],
  'assets.import':        ['primary_admin','org_admin','asset_manager'],
  'assets.export':        ['primary_admin','org_admin','asset_manager','finance_user','auditor'],
  'assets.view.financial':['primary_admin','org_admin','asset_manager','finance_user','auditor'],
  'branches.create':      ['primary_admin','org_admin','asset_manager'],
  'branches.edit':        ['primary_admin','org_admin','asset_manager','branch_manager'],
  'branches.delete':      ['primary_admin','org_admin','asset_manager'],
  'maintenance.create':   ['primary_admin','org_admin','asset_manager','branch_manager','maintenance_staff'],
  'maintenance.complete': ['primary_admin','org_admin','asset_manager','branch_manager','maintenance_staff'],
  'maintenance.assign':   ['primary_admin','org_admin','asset_manager','branch_manager'],
  'depreciation.record':  ['primary_admin','org_admin','asset_manager','finance_user'],
  'depreciation.edit':    ['primary_admin','org_admin','finance_user'],
  'disposal.approve':     ['primary_admin','org_admin','finance_user'],
  'reports.finance':      ['primary_admin','org_admin','finance_user','auditor'],
  'reports.audit':        ['primary_admin','org_admin','asset_manager','finance_user','auditor'],
  'settings.manage':      ['primary_admin','org_admin'],
  'team.manage':          ['primary_admin','org_admin'],
  'recognition.override': ['primary_admin','org_admin','finance_user'],
}

export function can(role: UserRole, permission: Permission): boolean {
  return permissionMatrix[permission]?.includes(role) ?? false
}

export function usePermission() {
  const role = useAuthStore((s) => s.role) as UserRole
  return {
    can: (permission: Permission) => can(role, permission),
    role,
  }
}
