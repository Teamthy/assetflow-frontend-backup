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
import { X, Rocket, Building2, Upload, Users, ArrowRight } from 'lucide-react'
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
  const title = isInviteFlow ? 'Your access is ready' : `${orgName} is live on AssetFlow!`
  const subtitle = isInviteFlow
    ? 'Your invitation is accepted and your workspace is ready for you.'
    : 'Your account is set up and ready. Here is what to do next to get the most out of AssetFlow.'

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
    <div className="mb-6 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-6 text-white relative overflow-hidden animate-fade-in">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 right-24 w-32 h-32 bg-white/5 rounded-full translate-y-16" />

      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
      >
        <X className="w-4 h-4 text-white/70" />
      </button>

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Rocket className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-white/80">{isInviteFlow ? 'Welcome aboard' : 'Getting started'}</span>
        </div>

        <h2 className="text-2xl font-bold mb-1">{title}</h2>
        <p className="text-white/70 mb-4 max-w-lg">{subtitle}</p>
        <p className="text-sm text-white/70 mb-5">You are signed in as {roleLabel}.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {actions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 p-3.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all group"
            >
              <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-white/60">{item.cta}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/60 ml-auto" />
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

