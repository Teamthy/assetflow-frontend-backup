'use client'

import { CreditCard, Package, Users, Building2, Mail, MessageCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { SettingsSection } from '@/components/shared/SettingsSection'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAssets } from '@/lib/hooks/useAssets'
import { useBranches } from '@/lib/hooks/useBranches'
import { usersApi } from '@/lib/api/users'

const STARTER_CAPS = {
  assets: 500,
  members: 25,
  branches: 10,
} as const

const UPGRADE_EMAIL = 'teemothy605@gmail.com'
const UPGRADE_SUBJECT = 'AssetFlow upgrade request'
const UPGRADE_BODY = 'Hi Timothy, I would like to increase the AssetFlow starter limits for my organization.'

export default function BillingPage() {
  const { data: assets } = useAssets({ limit: 1 })
  const { data: branches } = useBranches()
  const { data: members = [] } = useQuery({
    queryKey: ['users', 'billing'],
    queryFn: () => usersApi.list(),
  })

  const assetTotal = assets?.pagination?.total ?? assets?.items?.length ?? 0
  const branchTotal = Array.isArray(branches) ? branches.length : (branches?.data?.length ?? branches?.items?.length ?? 0)
  const memberTotal = members.length
  const mailto = `mailto:${UPGRADE_EMAIL}?subject=${encodeURIComponent(UPGRADE_SUBJECT)}&body=${encodeURIComponent(UPGRADE_BODY)}`
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${UPGRADE_SUBJECT}. ${UPGRADE_BODY} Contact: ${UPGRADE_EMAIL}`)}`

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
            <p className="text-sm text-slate-500 mt-1">
              Included with this deployment for about 100 daily users. Checkout is not enabled.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <UsageStat icon={Package} label="Assets" value={assetTotal} cap={STARTER_CAPS.assets} />
          <UsageStat icon={Users} label="Members" value={memberTotal} cap={STARTER_CAPS.members} />
          <UsageStat icon={Building2} label="Branches" value={branchTotal} cap={STARTER_CAPS.branches} />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Need more room"
        description="Ask to raise the starter caps. No card is collected here."
        icon={Mail}
      >
        <p className="text-sm text-slate-600">
          This workspace is sized for 500 assets, 25 members, and 10 branches. Email Timothy if you need a larger register.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={mailto}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Mail className="w-4 h-4" />
              Email to upgrade
            </Button>
          </a>
          <a href={whatsapp} target="_blank" rel="noreferrer">
            <Button variant="outline">
              <MessageCircle className="w-4 h-4" />
              WhatsApp message
            </Button>
          </a>
        </div>
      </SettingsSection>
    </div>
  )
}

function UsageStat({
  icon: Icon,
  label,
  value,
  cap,
}: {
  icon: React.ElementType
  label: string
  value: number
  cap: number
}) {
  const percent = cap > 0 ? Math.min(100, Math.round((value / cap) * 100)) : 0
  const over = value >= cap

  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm text-slate-700 mb-1.5">
        <span className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-slate-400" />
          {label}
        </span>
        <span className={over ? 'font-semibold text-amber-700' : 'text-slate-500'}>
          {value} / {cap}
        </span>
      </div>
      <Progress value={percent} className={over ? '[&>div]:bg-amber-500' : ''} />
    </div>
  )
}
