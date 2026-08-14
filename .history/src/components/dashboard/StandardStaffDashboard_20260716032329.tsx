'use client'

import { useQuery } from '@tanstack/react-query'
import { Package, Bell, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { assetApi } from '@/lib/api/assets'
import { notificationApi } from '@/lib/api/notifications'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatTimeAgo } from '@/lib/utils/format'
import { useAuthStore } from '@/lib/stores/auth'
import { normalizeListResponse } from '@/lib/utils/list'

export function StandardStaffDashboard() {
  const user = useAuthStore((s) => s.user)

  const { data: assignedAssets } = useQuery({
    queryKey: ['assets', 'list', 'assigned'],
    queryFn: () => assetApi.list({ limit: 10 }),
  })

  const { data: notifications } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => notificationApi.list({ limit: 5 }),
  })

  const assets = normalizeListResponse<any>(assignedAssets)
  const notificationsList = normalizeListResponse<any>(notifications)

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.fullName?.split(' ')[0]}</h1>
        <p className="text-slate-500 mt-1">Assets assigned to you and your recent activity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-brand-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">My Assets</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {Array.isArray(assets) && assets.map((asset) => (
              <Link key={asset.id} href={`/assets/${asset.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/70 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{asset.name}</p>
                  <p className="text-xs text-slate-400">{asset.assetTag}</p>
                </div>
                <StatusBadge status={asset.status} />
              </Link>
            ))}
            {!Array.isArray(assets) || !assets.length ? (
              <div className="px-6 py-12 text-center">
                <Package className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No assets assigned to you</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
            </div>
            <Link href="/notifications" className="text-sm font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {Array.isArray(notificationsList) && notificationsList.map((n) => (
              <div key={n.id} className={`px-6 py-4 ${!n.isRead ? 'bg-brand-50/30' : ''}`}>
                <div className="flex items-start gap-3">
                  {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{n.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatTimeAgo(n.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
            {!Array.isArray(notificationsList) || !notificationsList.length ? (
              <div className="px-6 py-12 text-center">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No notifications yet</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
