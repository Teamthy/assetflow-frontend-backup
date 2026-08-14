'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, Edit, ArrowLeftRight, Trash2, MoreHorizontal,
  Package, Clock, Wrench, TrendingDown, RotateCcw,
  Building2, User, Calendar, ShieldCheck, Tag, Barcode,
  AlertCircle,
} from 'lucide-react'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge, ConditionBadge, TreatmentBadge } from '@/components/shared/StatusBadge'
import { DetailSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { RoleGuard } from '@/components/shared/RoleGuard'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TransferAssetModal } from '@/components/assets/TransferAssetModal'
import { DisposeAssetModal } from '@/components/assets/DisposeAssetModal'
import { RestoreAssetModal } from '@/components/assets/RestoreAssetModal'
import { DepreciationModal } from '@/components/assets/DepreciationModal'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useAsset, useAssetTimeline, useDeleteAsset } from '@/lib/hooks/useAssets'
import { formatCurrency, formatDate, formatDateTime, formatTimeAgo, formatUsefulLife } from '@/lib/utils/format'
import { usePermission } from '@/lib/utils/permissions'
import { cn } from '@/lib/utils'

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') ?? 'overview'
  const actionParam = searchParams.get('action')
  const [tab, setTab] = useState(initialTab)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [disposeOpen, setDisposeOpen] = useState(false)
  const [restoreOpen, setRestoreOpen] = useState(false)
  const [depOpen, setDepOpen] = useState(false)
  const { can } = usePermission()

  const { data: asset, isLoading, error } = useAsset(id)
  const deleteAsset = useDeleteAsset()

  useEffect(() => {
    if (actionParam === 'transfer') {
      setTransferOpen(true)
      router.replace('/assets/' + id)
    } else if (actionParam === 'dispose') {
      setDisposeOpen(true)
      router.replace('/assets/' + id)
    } else if (actionParam === 'restore') {
      setRestoreOpen(true)
      router.replace('/assets/' + id)
    }
  }, [actionParam, id, router])

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (error || !asset) {
    return (
      <div className="max-w-5xl mx-auto">
        <Link href="/assets" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to assets
        </Link>
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-900">Asset not found</h2>
          <p className="text-sm text-slate-500 mt-1">This asset may have been deleted or you do not have access.</p>
        </div>
      </div>
    )
  }

  async function handleDelete() {
    await deleteAsset.mutateAsync(id)
    setDeleteOpen(false)
    router.push('/assets')
  }

  const canViewFinancial = can('assets.view.financial')
  const canDepreciate = can('depreciation.record')
  const isDisposed = asset.status === 'disposed'
  const isDeleted = asset.isDeleted

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/assets" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to assets
      </Link>

      {(isDisposed || isDeleted) && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              This asset is {isDisposed ? 'disposed' : 'deleted'}
            </p>
            <p className="text-sm text-amber-800 mt-0.5">
              You can restore it back to active or maintenance status if needed.
            </p>
          </div>
          <RoleGuard permission="assets.restore">
            <Button
              onClick={() => setRestoreOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              size="sm"
            >
              <RotateCcw className="w-4 h-4" />
              Restore
            </Button>
          </RoleGuard>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="w-7 h-7 text-slate-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{asset.name}</h1>
                <StatusBadge status={asset.status} />
                <ConditionBadge condition={asset.condition} />
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span className="font-mono">{asset.assetTag}</span>
                </span>
                {asset.serialNumber && (
                  <span className="flex items-center gap-1.5">
                    <Barcode className="w-3.5 h-3.5" />
                    <span className="font-mono">{asset.serialNumber}</span>
                  </span>
                )}
                {asset.accountingTreatment && (
                  <TreatmentBadge treatment={asset.accountingTreatment} />
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <RoleGuard permission="assets.edit">
              <Link href={'/assets/' + asset.id + '/edit'}>
                <Button variant="outline" disabled={isDisposed || isDeleted}>
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </Link>
            </RoleGuard>
            <RoleGuard permission="assets.transfer">
              <Link href={`/assets/${asset.id}/transfer`}>
                <Button
                  variant="outline"
                  disabled={isDisposed || isDeleted}
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Transfer
                </Button>
              </Link>
            </RoleGuard>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <RoleGuard permission="assets.dispose">
                  <DropdownMenuItem
                    disabled={isDisposed || isDeleted}
                    onClick={() => setDisposeOpen(true)}
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Dispose asset
                  </DropdownMenuItem>
                </RoleGuard>
                <RoleGuard permission="assets.restore">
                  {(isDisposed || isDeleted) && (
                    <DropdownMenuItem onClick={() => setRestoreOpen(true)}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restore asset
                    </DropdownMenuItem>
                  )}
                </RoleGuard>
                <RoleGuard permission="assets.delete">
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-700 focus:bg-red-50"
                    onClick={() => setDeleteOpen(true)}
                    disabled={isDeleted}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete asset
                  </DropdownMenuItem>
                </RoleGuard>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 h-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-100">Overview</TabsTrigger>
          {canViewFinancial && (
            <TabsTrigger value="financial" className="data-[state=active]:bg-slate-100">Financial</TabsTrigger>
          )}
          <TabsTrigger value="timeline" className="data-[state=active]:bg-slate-100">Timeline</TabsTrigger>
          <TabsTrigger value="maintenance" className="data-[state=active]:bg-slate-100">Maintenance</TabsTrigger>
          {canViewFinancial && canDepreciate && (
            <TabsTrigger value="depreciation" className="data-[state=active]:bg-slate-100">Depreciation</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-6"><OverviewTab asset={asset} /></TabsContent>
        {canViewFinancial && <TabsContent value="financial" className="mt-6"><FinancialTab asset={asset} /></TabsContent>}
        <TabsContent value="timeline" className="mt-6"><TimelineTab assetId={id} /></TabsContent>
        <TabsContent value="maintenance" className="mt-6"><MaintenanceTab asset={asset} /></TabsContent>
        {canViewFinancial && canDepreciate && <TabsContent value="depreciation" className="mt-6"><DepreciationTab asset={asset} onRecord={() => setDepOpen(true)} /></TabsContent>}
      </Tabs>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={'Delete ' + asset.name}
        description="This will move the asset to the deleted state. You can restore it later from the audit view."
        confirmLabel="Delete asset"
        variant="destructive"
        isLoading={deleteAsset.isPending}
        onConfirm={handleDelete}
      />

      <TransferAssetModal asset={asset} open={transferOpen} onOpenChange={setTransferOpen} />
      <DisposeAssetModal asset={asset} open={disposeOpen} onOpenChange={setDisposeOpen} />
      <RestoreAssetModal asset={asset} open={restoreOpen} onOpenChange={setRestoreOpen} />
      <DepreciationModal asset={asset} open={depOpen} onOpenChange={setDepOpen} />
    </div>
  )
}

function OverviewTab({ asset }: { asset: import('@/types').Asset }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <DetailCard title="General information">
          <DetailGrid>
            <DetailRow label="Category" value={asset.category ?? '-'} />
            <DetailRow label="Manufacturer" value={asset.manufacturer ?? '-'} />
            <DetailRow label="Model" value={asset.model ?? '-'} />
            <DetailRow label="Serial number" value={asset.serialNumber ?? '-'} mono />
          </DetailGrid>
          {asset.description && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Description</div>
              <p className="text-sm text-slate-700 leading-relaxed">{asset.description}</p>
            </div>
          )}
        </DetailCard>

        <DetailCard title="Location and custody">
          <DetailGrid>
            <DetailRow label="Branch" value={asset.branch?.name ?? 'Unassigned'} icon={Building2} />
            <DetailRow label="Assigned to" value={asset.assignedUser?.fullName ?? 'Unassigned'} icon={User} avatar={asset.assignedUser?.fullName} />
          </DetailGrid>
        </DetailCard>
      </div>

      <div className="space-y-6">
        <DetailCard title="Warranty">
          {asset.warrantyExpiryDate ? (
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <div>
                <div className="text-sm font-semibold text-slate-900">{formatDate(asset.warrantyExpiryDate)}</div>
                <div className="text-xs text-slate-500">{formatTimeAgo(asset.warrantyExpiryDate)}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400">No warranty information</div>
          )}
        </DetailCard>

        <DetailCard title="Timestamps">
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <div className="text-slate-500 text-xs">Created</div>
                <div className="text-slate-900">{formatDateTime(asset.createdAt)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <div className="text-slate-500 text-xs">Last updated</div>
                <div className="text-slate-900">{formatDateTime(asset.updatedAt)}</div>
              </div>
            </div>
          </div>
        </DetailCard>
      </div>
    </div>
  )
}

function FinancialTab({ asset }: { asset: import('@/types').Asset }) {
  const nbv = asset.purchaseCost && asset.residualValue !== undefined
    ? asset.purchaseCost - (asset.residualValue ?? 0)
    : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <DetailCard title="Cost and depreciation">
          <DetailGrid>
            <DetailRow label="Purchase cost" value={asset.purchaseCost ? formatCurrency(asset.purchaseCost ?? 0) : '-'} highlight />
            <DetailRow label="Residual value" value={asset.residualValue !== undefined ? formatCurrency(asset.residualValue ?? 0) : '-'} />
            <DetailRow label="Useful life" value={formatUsefulLife(asset.expectedUsefulLifeMonths)} />
            <DetailRow label="Purchase date" value={formatDate(asset.purchaseDate)} />
          </DetailGrid>
          {nbv !== null && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Depreciable base</span>
              <span className="text-base font-semibold text-slate-900">{formatCurrency(nbv)}</span>
            </div>
          )}
        </DetailCard>

        <DetailCard title="Recognition assessment">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Accounting treatment</span>
              {asset.accountingTreatment && <TreatmentBadge treatment={asset.accountingTreatment} />}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Depreciable</span>
              <span className={cn('text-sm font-semibold', asset.isDepreciable ? 'text-emerald-600' : 'text-slate-500')}>
                {asset.isDepreciable ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Future economic benefit</span>
              <span className="text-sm font-semibold text-slate-900">
                {asset.hasFutureEconomicBenefit === false ? 'No' : 'Yes'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Cost reliably measured</span>
              <span className="text-sm font-semibold text-slate-900">
                {asset.costCanBeReliablyMeasured === false ? 'No' : 'Yes'}
              </span>
            </div>

            {asset.recognitionReasons && asset.recognitionReasons.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Reasons</div>
                <ul className="space-y-1">
                  {asset.recognitionReasons.map((r, i) => (
                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DetailCard>
      </div>

      <div>
        <DetailCard title="Key figures">
          <div className="space-y-4">
            <StatBlock label="Net book value" value={nbv !== null ? formatCurrency(nbv) : '-'} highlight />
            <StatBlock label="Useful life remaining" value={formatUsefulLife(asset.expectedUsefulLifeMonths)} />
          </div>
        </DetailCard>
      </div>
    </div>
  )
}

function TimelineTab({ assetId }: { assetId: string }) {
  const { data: timelineResp, isLoading } = useAssetTimeline(assetId)
  // Timeline response: { asset, lifecycle:{data:[]}, transfers:[], ... }
  const tl = timelineResp as Record<string, unknown> | undefined
  const lcData = tl?.lifecycle as Record<string, unknown> | undefined
  const events: Record<string, unknown>[] =
    Array.isArray(lcData?.data) ? (lcData.data as Record<string, unknown>[]) : []

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-400 text-sm">
        Loading timeline...
      </div>
    )
  }

  if (!events || events.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <EmptyState
          icon={Clock}
          title="No timeline events yet"
          description="Asset lifecycle events (transfers, maintenance, depreciation) will appear here."
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-900">Activity timeline</h3>
        <p className="text-sm text-slate-500 mt-0.5">{events.length} events</p>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {events.map((event: Record<string, unknown>, idx: number) => (
            <div key={idx} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                {idx < events.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 mt-2" />}
              </div>
              <div className="flex-1 pb-6">
                <div className="text-sm font-semibold text-slate-900">
                  {String(event.title ?? event.eventType ?? event.type ?? 'Event')}
                </div>
                {typeof event.description === 'string' && event.description && (
                  <div className="text-sm text-slate-600 mt-0.5">{event.description}</div>
                )}
                <div className="text-xs text-slate-400 mt-1">
                  {event.createdAt ? formatTimeAgo((event.createdAt as string) ?? "") : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MaintenanceTab({ asset }: { asset: import('@/types').Asset }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Maintenance history</h3>
          <p className="text-sm text-slate-500 mt-0.5">Tasks for {asset.name}</p>
        </div>
        <RoleGuard permission="maintenance.create">
          <Link href={'/maintenance?assetId=' + asset.id}>
            <Button variant="outline">
              <Wrench className="w-4 h-4" />
              View all tasks
            </Button>
          </Link>
        </RoleGuard>
      </div>
      <EmptyState
        icon={Wrench}
        title="Maintenance module coming next"
        description="Maintenance tasks for this asset will appear here in Phase 4."
      />
    </div>
  )
}

function DepreciationTab({ asset, onRecord }: { asset: import('@/types').Asset; onRecord: () => void }) {
  const eligible = asset.accountingTreatment === 'capitalized' && asset.isDepreciable

  if (!eligible) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Depreciation not applicable</p>
              <p className="text-sm text-amber-800 mt-1">
                Depreciation can only be recorded for capitalized, depreciable assets. This asset is treated as{' '}
                <span className="font-semibold">{asset.accountingTreatment ?? 'unknown'}</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Depreciation records</h3>
          <p className="text-sm text-slate-500 mt-0.5">Yearly depreciation snapshots</p>
        </div>
        <RoleGuard permission="depreciation.record">
          <Button onClick={onRecord} className="bg-blue-600 hover:bg-blue-700 text-white">
            <TrendingDown className="w-4 h-4" />
            Record depreciation
          </Button>
        </RoleGuard>
      </div>
      <EmptyState
        icon={TrendingDown}
        title="No depreciation recorded yet"
        description="Click Record depreciation above to add the first yearly snapshot."
      />
    </div>
  )
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">{children}</div>
}

function DetailRow({
  label, value, icon: Icon, avatar, mono, highlight,
}: {
  label: string
  value: string
  icon?: React.ElementType
  avatar?: string
  mono?: boolean
  highlight?: boolean
}) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">{label}</div>
      <div className="flex items-center gap-2">
        {avatar ? (
          <UserAvatar name={avatar} size="sm" />
        ) : Icon ? (
          <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : null}
        <span className={cn(
          'text-slate-900',
          highlight ? 'text-base font-semibold' : 'text-sm',
          mono && 'font-mono'
        )}>
          {value}
        </span>
      </div>
    </div>
  )
}

function StatBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">{label}</div>
      <div className={cn('font-semibold text-slate-900', highlight ? 'text-2xl tracking-tight' : 'text-base')}>
        {value}
      </div>
    </div>
  )
}
