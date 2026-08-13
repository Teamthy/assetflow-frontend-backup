/**
 * Demo / present-deployment switch.
 * Set NEXT_PUBLIC_ENFORCE_RBAC=true to restore sidebar, RoleGuard, and permission checks.
 * Authentication is never bypassed.
 */
export const isRbacEnforced = (): boolean =>
  process.env.NEXT_PUBLIC_ENFORCE_RBAC === 'true'
