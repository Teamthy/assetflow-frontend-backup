'use client'

import { usePermission } from '@/lib/utils/permissions'
import type { Permission } from '@/lib/utils/permissions'

interface RoleGuardProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ permission, children, fallback = null }: RoleGuardProps) {
  const { can } = usePermission()
  if (!can(permission)) return <>{fallback}</>
  return <>{children}</>
}
