'use client'

import { useRouter } from 'next/navigation'
import { TrendingUp, ArrowLeft, Zap } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'

export default function PlanLimitPage() {
  const router = useRouter()
  const role = useAuthStore((s) => s.role)
  const isAdmin = role === 'primary_admin' || role === 'org_admin'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <TrendingUp className="w-8 h-8 text-purple-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Plan Limit Reached</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          {isAdmin
            ? "You've reached your current plan's asset or user limit. Upgrade your plan to continue adding records."
            : 'Your organization has reached its plan limit. Contact your administrator to upgrade.'}
        </p>
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-600">Current Plan</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-200">
              Starter
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Assets</span>
              <span className="font-semibold text-slate-900">250 / 250</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-red-500 h-1.5 rounded-full w-full" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg border border-slate-200 transition-all duration-150"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          {isAdmin && (
            <a
              href="/settings/billing"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-all duration-150"
            >
              <Zap className="w-4 h-4" />
              Upgrade Plan
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
