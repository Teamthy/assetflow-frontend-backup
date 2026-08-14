'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Building2, Package, Edit, Trash2, Wrench, MapPin,
  Calendar, AlertCircle,
} from 'lucide-react'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { DetailSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { RoleGuard } from '@/components/shared/RoleGuard'
import { StatusBadge, ConditionBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { useBranch } from '@/lib/hooks/useBranches'
import { useAssets } from '@/lib/hooks/useAssets'
import { EditBranchModal } from '@/components/branches/EditBranchModal'
import { DeleteBranchModal } from '@/components/branches/DeleteBranchModal'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format'
import { useRouter } from 'next/navigation'

export default function BranchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: branch, isLoading, error } = useBranch(id)
  const { data: assets } = useAssets({ branchId: id, limit: 100 })

  if (isLoading) return <DetailSkeleton />

  if (error || !branch) {
    return (
      <div className="max-w-5xl mx-auto">
        <Link href="/branches" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to branches
        </Link>
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-900">Branch not found</h2>
        </div>
      </div>
    )
  }

  const items = assets?.data ?? assets?.items ?? []
  const totalAssets = assets?.pagination?.total ?? items.length
  const inMaintenance = items.filter((a) => a.status === 'maintenance').length
  const totalValue = items.reduce((sum, a) => sum + (a.purchaseCost ?? 0), 0)

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/branches" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to branches
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-purple-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{branch.name}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-500 mt-1.5 flex-wrap">
                {branch.code && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{branch.code}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Created {formatDate(branch.createdAt)}
                </span>
              </div>
              {branch.description && (
                <p className="text-sm text-slate-600 mt-3 max-w-2xl">{branch.description}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <RoleGuard permission="branches.edit">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </RoleGuard>
            <RoleGuard permission="branches.delete">
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(true)}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </RoleGuard>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total assets"
          value={totalAssets}
          icon={Package}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="In maintenance"
          value={inMaintenance}
          icon={Wrench}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatCard
          title="Total value"
          value={formatCurrency(totalValue)}
          icon={Package}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Assets in this branch</h3>
            <p className="text-sm text-slate-500 mt-0.5">{totalAssets} assets</p>
          </div>
          <Link href={'/assets?branchId=' + branch.id}>
            <Button variant="outline">View all in assets list</Button>
          </Link>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No assets in this branch"
            description="Assets assigned to this branch will appear here."
            action={
              <RoleGuard permission="assets.create">
                <Link href="/assets/new">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Add asset
                  </Button>
                </Link>
              </RoleGuard>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Asset</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Tag</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Condition</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.slice(0, 20).map((asset) => (
                  <tr
                    key={asset.id}
                    onClick={() => router.push('/assets/' + asset.id)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3">
                      <div className="text-sm font-medium text-slate-900">{asset.name}</div>
                      {asset.category && <div className="text-xs text-slate-500">{asset.category}</div>}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 font-mono">{asset.assetTag}</td>
                    <td className="px-6 py-3"><StatusBadge status={asset.status} /></td>
                    <td className="px-6 py-3"><ConditionBadge condition={asset.condition} /></td>
                    <td className="px-6 py-3 text-sm text-slate-900 font-medium text-right">
                      {asset.purchaseCost ? formatCurrency(asset.purchaseCost) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length > 20 && (
              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 text-center text-sm text-slate-500">
                Showing 20 of {totalAssets} - <Link href={'/assets?branchId=' + branch.id} className="text-blue-600 hover:underline font-medium">view all</Link>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-slate-400 text-right">
        Last updated {formatDateTime(branch.updatedAt ?? branch.createdAt)}
      </div>

      <EditBranchModal branch={branch} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteBranchModal branch={branch} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  )
}
