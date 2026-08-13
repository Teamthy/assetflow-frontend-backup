'use client'

import { CreditCard, Package, Users, Building2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { SettingsSection } from '@/components/shared/SettingsSection'
import { useAssets } from '@/lib/hooks/useAssets'
import { useBranches } from '@/lib/hooks/useBranches'
import { usersApi } from '@/lib/api/users'

export default function BillingPage() {
  const { data: assets } = useAssets({ limit: 1 })
  const { data: branches } = useBranches()
  const { data: members = [] } = useQuery({ queryKey: ['users', 'billing'], queryFn: usersApi.list })

  const assetTotal = assets?.pagination?.total ?? assets?.items?.length ?? 0
  const branchTotal = Array.isArray(branches) ? branches.length : (branches?.data?.length ?? branches?.items?.length ?? 0)

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Current plan"
        description="Workspace usage for this deployment"
        icon={CreditCard}
      >
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
            <Package className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Starter</h3>
            <p className="text-sm text-slate-500 mt-1">Included with this deployment. Billing checkout is not enabled.</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <UsageStat icon={Package} label="Assets" value={assetTotal} />
          <UsageStat icon={Users} label="Members" value={members.length} />
          <UsageStat icon={Building2} label="Branches" value={branchTotal} />
        </div>
      </SettingsSection>
    </div>
  )
}

function UsageStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-sm text-slate-700 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        {label}
      </div>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  )
}
