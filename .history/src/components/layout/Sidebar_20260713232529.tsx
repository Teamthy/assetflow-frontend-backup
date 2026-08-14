'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import {
  LayoutDashboard, Package, Building2, Wrench, BarChart3,
  Bell, Settings, ChevronLeft, ChevronRight, X, ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/stores/auth'
import { useUIStore } from '@/lib/stores/ui'
import type { UserRole } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles: UserRole[] | 'all'
}

interface NavSection {
  label: string | null
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    label: null,
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: 'all' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Assets', href: '/assets', icon: Package, roles: ['primary_admin', 'org_admin', 'asset_manager', 'finance_user', 'branch_manager', 'auditor', 'standard_staff'] },
      { label: 'Branches', href: '/branches', icon: Building2, roles: ['primary_admin', 'org_admin', 'asset_manager', 'finance_user', 'branch_manager', 'auditor'] },
      { label: 'Maintenance', href: '/maintenance', icon: Wrench, roles: ['primary_admin', 'org_admin', 'asset_manager', 'branch_manager', 'maintenance_staff'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['primary_admin', 'org_admin', 'asset_manager', 'finance_user', 'branch_manager', 'auditor'] },
      { label: 'Approvals', href: '/approvals', icon: ShieldCheck, roles: ['primary_admin', 'org_admin', 'finance_user'] },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Notifications', href: '/notifications', icon: Bell, roles: 'all' },
      { label: 'Settings', href: '/settings', icon: Settings, roles: ['primary_admin', 'org_admin'] },
    ],
  },
]

function canAccess(roles: UserRole[] | 'all', userRole: UserRole | null): boolean {
  if (roles === 'all') return true
  if (!userRole) return false
  return roles.includes(userRole)
}

export function Sidebar() {
  const pathname = usePathname()
  const role = useAuthStore((s) => s.role)
  const organization = useAuthStore((s) => s.organization)
  const { sidebarCollapsed, toggleSidebar, mobileOpen, setMobileOpen } = useUIStore()

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname, setMobileOpen])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && mobileOpen) setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen, setMobileOpen])

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-200',
          // Desktop widths
          'lg:z-40',
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-60',
          // Mobile: full drawer or hidden
          mobileOpen ? 'w-72 translate-x-0' : '-translate-x-full w-72 lg:translate-x-0'
        )}
      >
        <div className={cn(
          'flex items-center h-[60px] border-b border-slate-100 flex-shrink-0 px-4',
          sidebarCollapsed && 'lg:justify-center'
        )}>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white"/>
                <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.6"/>
                <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.6"/>
                <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white"/>
              </svg>
            </div>
            <div className={cn('min-w-0', sidebarCollapsed && 'lg:hidden')}>
              <span className="text-slate-900 font-bold text-sm tracking-tight block truncate">AssetFlow</span>
              {organization?.name && (
                <span className="text-slate-400 text-xs block truncate">{organization.name}</span>
              )}
            </div>
          </div>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          {navSections.map((section, sectionIdx) => {
            const visibleItems = section.items.filter((item) => canAccess(item.roles, role))
            if (visibleItems.length === 0) return null

            return (
              <div key={sectionIdx} className={cn('mb-1', sectionIdx > 0 && 'mt-4')}>
                {section.label && (
                  <p className={cn(
                    'text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 mb-1.5',
                    sidebarCollapsed && 'lg:hidden'
                  )}>
                    {section.label}
                  </p>
                )}
                {section.label && sidebarCollapsed && (
                  <div className="mx-3 mb-1.5 h-px bg-slate-100 hidden lg:block" />
                )}
                <div className="space-y-0.5 px-2">
                  {visibleItems.map((item) => {
                    const Icon = item.icon
                    const isActive = item.href === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname.startsWith(item.href)

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative group',
                          isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        )}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-r-full" />
                        )}
                        <Icon className={cn(
                          'w-4 h-4 flex-shrink-0',
                          isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                        )} />
                        <span className={cn('flex-1 truncate', sidebarCollapsed && 'lg:hidden')}>
                          {item.label}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="p-2 border-t border-slate-100 hidden lg:block">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center h-9 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all duration-150"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  )
}
