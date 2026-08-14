'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { AdminDashboard } from '@/components/dashboard/AdminDashboard'
import { AssetManagerDashboard } from '@/components/dashboard/AssetManagerDashboard'
import { FinanceDashboard } from '@/components/dashboard/FinanceDashboard'
import { BranchManagerDashboard } from '@/components/dashboard/BranchManagerDashboard'
import { MaintenanceDashboard } from '@/components/dashboard/MaintenanceDashboard'
import { AuditorDashboard } from '@/components/dashboard/AuditorDashboard'
import { StandardStaffDashboard } from '@/components/dashboard/StandardStaffDashboard'
import { OnboardingBanner } from '@/components/onboarding/OnboardingBanner'
import { X, Building2, Upload, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { UserRole } from '@/types'

const dashboardMap: Record<UserRole, React.ComponentType> = {
  admin: AdminDashboard,
  asset_manager: AssetManagerDashboard,
  finance: FinanceDashboard,
  branch_manager: BranchManagerDashboard,
  maintenance_staff: MaintenanceDashboard,
  auditor: AuditorDashboard,
  standard_staff: StandardStaffDashboard,
}

function WelcomeBanner({ orgName, onDismiss, role, source }: { orgName: string; onDismiss: () => void; role: UserRole; source?: string }) {
  const isInviteFlow = source === 'invite'
  const title = orgName
  const subtitle = isInviteFlow
    ? 'Invitation accepted. You can start work now.'
    : 'Add branches, import the register, or invite colleagues.'

  const actions = isInviteFlow
    ? [
      {
        icon: Building2,
        label: 'Review your workspace',
        desc: 'Check your assigned areas and branches',
        href: '/branches',
        cta: 'Open workspace',
      },
      {
        icon: Upload,
        label: 'Import assets',
        desc: 'Bring in your first asset register',
        href: '/assets/import',
        cta: 'Import now',
      },
      {
        icon: Users,
        label: 'Meet your team',
        desc: 'See who is collaborating with you',
        href: '/settings/team',
        cta: 'View team',
      },
    ]
    : [
      {
        icon: Building2,
        label: 'Set up branches',
        desc: 'Organize by location',
        href: '/branches',
        cta: 'Add branch',
      },
      {
        icon: Upload,
        label: 'Import assets',
        desc: 'Upload your register',
        href: '/assets/import',
        cta: 'Import now',
      },
      {
        icon: Users,
        label: 'Invite your team',
        desc: 'Add staff and managers',
        href: '/settings/team',
        cta: 'Invite team',
      },
    ]

  const roleLabel = role === 'standard_staff' ? 'Staff member' : role === 'admin' ? 'Admin' : 'Team member'

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 relative">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
      >
        <X className="w-4 h-4" />
      </button>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-1">
          {isInviteFlow ? 'Invitation accepted' : 'Setup'}
        </p>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">{title}</h2>
        <p className="text-sm text-slate-500 mb-1">{subtitle}</p>
        <p className="text-sm text-slate-500 mb-4">Signed in as {roleLabel}.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {actions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-500">{item.cta}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 ml-auto" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const role = useAuthStore((s) => s.role) as UserRole
  const org = useAuthStore((s) => s.organization)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    if (searchParams.get('welcome') === 'true') {
      setShowWelcome(true)
      // Remove param from URL without reload
      router.replace('/dashboard')
    }
  }, [searchParams, router])

  const DashboardComponent = dashboardMap[role] ?? AdminDashboard

  return (
    <div>
      {showWelcome && org && (
        <WelcomeBanner
          orgName={org.name}
          role={role}
          source={searchParams.get('source') ?? undefined}
          onDismiss={() => setShowWelcome(false)}
        />
      )}
      <OnboardingBanner />
      <DashboardComponent />
    </div>
  )
}

