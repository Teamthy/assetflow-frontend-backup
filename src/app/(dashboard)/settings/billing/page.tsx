'use client'

import { CreditCard, Package, Users, Building2, Check, ArrowRight, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { SettingsSection } from '@/components/shared/SettingsSection'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'

const currentPlan = {
  name: 'Free Trial',
  price: 0,
  interval: 'trial',
  limits: {
    assets: 50,
    users: 3,
    branches: 2,
  },
  usage: {
    assets: 12,
    users: 1,
    branches: 1,
  },
}

const plans = [
  {
    name: 'Starter',
    price: 180000,
    interval: 'year',
    description: 'For small teams getting organized',
    features: ['Up to 300 assets', 'Up to 5 users', 'Up to 3 branches', 'Excel import/export', 'Email support'],
    limits: { assets: 300, users: 5, branches: 3 },
  },
  {
    name: 'Growth',
    price: 480000,
    interval: 'year',
    description: 'For growing organizations',
    features: ['Up to 1,000 assets', 'Up to 15 users', 'Up to 5 branches', 'Advanced reporting', 'Priority support'],
    limits: { assets: 1000, users: 15, branches: 5 },
    popular: true,
  },
  {
    name: 'Business',
    price: 1200000,
    interval: 'year',
    description: 'For established enterprises',
    features: ['Up to 5,000 assets', 'Unlimited users', 'Unlimited branches', 'Custom reports', 'Dedicated support'],
    limits: { assets: 5000, users: null, branches: null },
  },
]

function formatNGN(n: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n)
}

function UsageBar({ label, used, limit, icon: Icon }: { label: string; used: number; limit: number; icon: React.ElementType }) {
  const pct = Math.min(100, (used / limit) * 100)
  const isHigh = pct > 80
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-sm text-slate-700">
          <Icon className="w-3.5 h-3.5 text-slate-400" />
          {label}
        </div>
        <div className="text-sm">
          <span className="font-semibold text-slate-900">{used}</span>
          <span className="text-slate-400"> / {limit}</span>
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={'h-full transition-all ' + (isHigh ? 'bg-red-500' : 'bg-blue-500')}
          style={{ width: pct + '%' }}
        />
      </div>
    </div>
  )
}

export default function BillingPage() {
  function handleUpgrade(planName: string) {
    toast.info(planName + ' plan upgrade coming soon. Paystack integration in progress.')
  }

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Current plan"
        description="Your active subscription and usage"
        icon={CreditCard}
      >
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-7 h-7 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">{currentPlan.name}</h3>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-semibold">
                  Active
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {currentPlan.price === 0 ? 'Free trial - 30 days' : formatNGN(currentPlan.price) + ' / ' + currentPlan.interval}
              </p>
            </div>
          </div>
          <Button
            onClick={() => handleUpgrade('Growth')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Upgrade plan
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <UsageBar label="Assets" used={currentPlan.usage.assets} limit={currentPlan.limits.assets} icon={Package} />
          <UsageBar label="Users" used={currentPlan.usage.users} limit={currentPlan.limits.users} icon={Users} />
          <UsageBar label="Branches" used={currentPlan.usage.branches} limit={currentPlan.limits.branches} icon={Building2} />
        </div>
      </SettingsSection>

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Available plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={
                'bg-white rounded-xl border shadow-sm p-6 relative ' +
                (plan.popular ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200')
              }
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most popular
                  </span>
                </div>
              )}
              <h4 className="text-lg font-bold text-slate-900">{plan.name}</h4>
              <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-slate-900">{formatNGN(plan.price)}</span>
                <span className="text-sm text-slate-500 ml-1">/ {plan.interval}</span>
              </div>
              <ul className="mt-5 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleUpgrade(plan.name)}
                className={
                  'w-full mt-6 ' +
                  (plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : '')
                }
                variant={plan.popular ? 'default' : 'outline'}
              >
                {plan.popular ? 'Upgrade to ' + plan.name : 'Choose ' + plan.name}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <SettingsSection
        title="Invoice history"
        description="Past invoices and receipts"
      >
        <EmptyState
          icon={CreditCard}
          title="No invoices yet"
          description="You are on a free trial. Invoices will appear here after you upgrade to a paid plan."
        />
      </SettingsSection>
    </div>
  )
}
