'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2, Landmark, Users, CreditCard, Bell, Shield,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { isRbacEnforced } from '@/lib/access'
import { usePermission } from '@/lib/utils/permissions'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  description: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  {
    label: 'Organization',
    href: '/settings',
    icon: Building2,
    description: 'Name, logo, industry',
    adminOnly: true,
  },
  {
    label: 'Accounting policy',
    href: '/settings/accounting-policy',
    icon: Landmark,
    description: 'Capitalization, depreciation',
    adminOnly: true,
  },
  {
    label: 'Team',
    href: '/settings/team',
    icon: Users,
    description: 'Members, invitations, roles',
    adminOnly: true,
  },
  {
    label: 'Billing',
    href: '/settings/billing',
    icon: CreditCard,
    description: 'Plan, seats, invoices',
    adminOnly: true,
  },
  {
    label: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
    description: 'Your notification preferences',
  },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { role } = usePermission()

  const isAdmin = !isRbacEnforced() || role === 'admin'
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Settings"
        description="Manage your organization, team, and preferences"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = item.href === '/settings'
              ? pathname === '/settings'
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-start gap-3 px-3 py-3 rounded-lg text-sm transition-all duration-150 relative group',
                  isActive
                    ? 'bg-blue-50 text-blue-900'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
                )}
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                  isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 pt-0.5">
                  <div className={cn(
                    'font-semibold',
                    isActive ? 'text-blue-900' : 'text-slate-900'
                  )}>
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {item.description}
                  </div>
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
