'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, Upload, Download, Search, Filter, X, Package,
  ChevronLeft, ChevronRight, MoreHorizontal, ArrowUpDown,
  Eye, Edit, ArrowLeftRight, Trash2, TrendingDown, Wrench, CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge, ConditionBadge, TreatmentBadge } from '@/components/shared/StatusBadge'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { RoleGuard } from '@/components/shared/RoleGuard'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DisposeAssetModal } from '@/components/assets/DisposeAssetModal'
import { BulkTransferDialog } from '@/components/assets/BulkTransferDialog'
import { BulkDisposeDialog } from '@/components/assets/BulkDisposeDialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useAssets, useDeleteAsset } from '@/lib/hooks/useAssets'
import { useBulkDelete, useBulkUpdateStatus } from '@/lib/hooks/useBulkAssets'
import { useBranches } from '@/lib/hooks/useBranches'
import { assetApi } from '@/lib/api/assets'
import { formatCurrency } from '@/lib/utils/format'
import { downloadBlob, downloadTextFile, toCsv } from '@/lib/utils/download'
import { Checkbox } from '@/components/ui/checkbox'
import type { Asset, AssetStatus, AssetCondition, AccountingTreatment } from '@/types'

export default function AssetsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [conditionFilter, setConditionFilter] = useState<string>('all')
  const [branchFilter, setBranchFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [treatmentFilter, setTreatmentFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null)
  const [assetToDispose, setAssetToDispose] = useState<Asset | null>(null)
  const [selected, setSelected] = useState<Record<string, Asset>>({})
  const [bulkTransferOpen, setBulkTransferOpen] = useState(false)
  const [bulkDisposeOpen, setBulkDisposeOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<'active' | 'maintenance' | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const { data: branchResp } = useBranches()
  const branches = branchResp?.data ?? branchResp?.items ?? []

  const params = useMemo(() => ({
    page,
    limit: pageSize,
    search: search || undefined,
    status: statusFilter !== 'all' ? (statusFilter as AssetStatus) : undefined,
    condition: conditionFilter !== 'all' ? (conditionFilter as AssetCondition) : undefined,
    category: categoryFilter.trim() || undefined,
    accountingTreatment: treatmentFilter !== 'all' ? (treatmentFilter as AccountingTreatment) : undefined,
    branchId: branchFilter !== 'all' ? branchFilter : undefined,
    sortBy,
    sortOrder,
  }), [page, pageSize, search, statusFilter, conditionFilter, branchFilter, treatmentFilter, categoryFilter, sortBy, sortOrder])

  const { data, isLoading, isFetching, error } = useAssets(params)
  const deleteAsset = useDeleteAsset()
  const bulkDelete = useBulkDelete()
  const bulkStatusUpdate = useBulkUpdateStatus()

  const assets = data?.data ?? data?.items ?? []
  const total = data?.pagination?.total ?? 0
  const totalPages = data?.pagination?.totalPages ?? 1
  const selectedAssets = Object.values(selected)
  const selectedIds = selectedAssets.map((asset) => asset.id)
  const transferableSelected = selectedAssets.filter((asset) => asset.status !== 'disposed')
  const allVisibleSelected = assets.length > 0 && assets.every((asset) => Boolean(selected[asset.id]))
  const overBulkLimit = selectedIds.length > 100
  const hasActiveFilters =
    statusFilter !== 'all' ||
    conditionFilter !== 'all' ||
    branchFilter !== 'all' ||
    treatmentFilter !== 'all' ||
    categoryFilter.trim() !== '' ||
    search !== ''

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
    setConditionFilter('all')
    setBranchFilter('all')
    setTreatmentFilter('all')
    setCategoryFilter('')
    setPage(1)
  }

  function toggleSort(column: string) {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  async function handleExport() {
    try {
      const blob = await assetApi.export(params)
      downloadBlob(blob, 'assets-' + new Date().toISOString().split('T')[0] + '.xlsx')
      toast.success('Export downloaded')
    } catch {
      toast.error('Export failed')
    }
  }

  function exportSelectedCsv() {
    const rows = selectedAssets.map((asset) => ({
      name: asset.name,
      assetTag: asset.assetTag,
      status: asset.status,
      condition: asset.condition,
      category: asset.category ?? '',
      branch: asset.branch?.name ?? '',
      purchaseCost: asset.purchaseCost ?? '',
      treatment: asset.accountingTreatment ?? '',
    }))
    if (rows.length === 0) {
      toast.error('Select at least one asset')
      return
    }
    downloadTextFile(toCsv(rows), `assets-selected-${new Date().toISOString().slice(0, 10)}.csv`)
    toast.success(`${rows.length} selected assets exported`)
  }

  async function handleDelete() {
    if (!assetToDelete) return
    await deleteAsset.mutateAsync(assetToDelete.id)
    setAssetToDelete(null)
  }

  function clearSelection(ids?: string[]) {
    if (!ids) {
      setSelected({})
      return
    }
    setSelected((prev) => {
      const next: Record<string, Asset> = { ...prev }
      ids.forEach((id) => { delete next[id] })
      return next
    })
  }

  function requireBulkSelection() {
    if (selectedIds.length === 0) {
      toast.error('Select at least one asset')
      return false
    }
    if (overBulkLimit) {
      toast.error('Select at most 100 assets for a bulk action')
      return false
    }
    return true
  }

  function openBulkTransfer() {
    if (!requireBulkSelection()) return
    if (transferableSelected.length === 0) {
      toast.error('Disposed assets cannot be transferred')
      return
    }
    setBulkTransferOpen(true)
  }

  function openBulkDispose() {
    if (!requireBulkSelection()) return
    if (transferableSelected.length === 0) {
      toast.error('Disposed assets cannot be disposed again')
      return
    }
    setBulkDisposeOpen(true)
  }

  async function handleBulkStatus() {
    if (!bulkStatus || !requireBulkSelection()) return
    try {
      const result = await bulkStatusUpdate.mutateAsync({
        assetIds: selectedIds,
        status: bulkStatus,
        reason: `Bulk status change to ${bulkStatus} from asset list`,
      })
      clearSelection(result.successful ?? [])
      setBulkStatus(null)
    } catch {
      // toast from hook
    }
  }

  async function handleBulkDelete() {
    if (!requireBulkSelection()) return
    try {
      const result = await bulkDelete.mutateAsync({
        assetIds: selectedIds,
        reason: 'Bulk delete from asset list',
      })
      clearSelection(result.successful ?? [])
      setBulkDeleteOpen(false)
    } catch {
      // toast from hook
    }
  }

  const showEmptyStateFirstTime = !isLoading && !hasActiveFilters && assets.length === 0
  const showNoResults = !isLoading && hasActiveFilters && assets.length === 0

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Assets"
        description={total > 0 ? total + ' assets in your register' : 'Manage your fixed asset register'}
        actions={
          <div className="flex gap-2">
            <RoleGuard permission="assets.export">
              <Button variant="outline" onClick={selectedIds.length ? exportSelectedCsv : handleExport} disabled={assets.length === 0}>
                <Download className="w-4 h-4" />
                {selectedIds.length ? `Export ${selectedIds.length}` : 'Export'}
              </Button>
            </RoleGuard>
            <RoleGuard permission="assets.import">
              <Link href="/assets/import">
                <Button variant="outline">
                  <Upload className="w-4 h-4" />
                  Import
                </Button>
              </Link>
            </RoleGuard>
            <RoleGuard permission="assets.create">
              <Link href="/assets/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4" />
                  Add asset
                </Button>
              </Link>
            </RoleGuard>
          </div>
        }
      />

      {selectedIds.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <span className="mr-2 text-sm font-semibold text-blue-900">
            {selectedIds.length} selected
            {overBulkLimit ? ' · max 100 per action' : ''}
          </span>
          <RoleGuard permission="assets.transfer">
            <Button size="sm" variant="outline" onClick={openBulkTransfer} className="bg-white">
              <ArrowLeftRight className="h-4 w-4" />
              Transfer
            </Button>
          </RoleGuard>
          <RoleGuard permission="assets.dispose">
            <Button size="sm" variant="outline" onClick={openBulkDispose} className="bg-white">
              <TrendingDown className="h-4 w-4" />
              Dispose
            </Button>
          </RoleGuard>
          <RoleGuard permission="assets.edit">
            <Button size="sm" variant="outline" onClick={() => requireBulkSelection() && setBulkStatus('maintenance')} className="bg-white">
              <Wrench className="h-4 w-4" />
              Maintenance
            </Button>
            <Button size="sm" variant="outline" onClick={() => requireBulkSelection() && setBulkStatus('active')} className="bg-white">
              <CheckCircle2 className="h-4 w-4" />
              Mark active
            </Button>
          </RoleGuard>
          <RoleGuard permission="assets.delete">
            <Button size="sm" variant="outline" onClick={() => requireBulkSelection() && setBulkDeleteOpen(true)} className="bg-white text-red-700">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </RoleGuard>
          <RoleGuard permission="assets.export">
            <Button size="sm" variant="outline" onClick={exportSelectedCsv} className="bg-white">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </RoleGuard>
          <button
            type="button"
            onClick={() => clearSelection()}
            className="ml-auto text-sm font-medium text-blue-800 hover:text-blue-950"
          >
            Clear selection
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[240px] max-w-md">
              <SearchInput
                value={search}
                onChange={(v) => { setSearch(v); setPage(1) }}
                placeholder="Search by name, tag, serial..."
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters || hasActiveFilters ? 'border-blue-300 bg-blue-50 text-blue-700' : ''}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  {[statusFilter !== 'all', conditionFilter !== 'all', branchFilter !== 'all', treatmentFilter !== 'all', Boolean(categoryFilter.trim())].filter(Boolean).length + (search ? 1 : 0)}
                </span>
              )}
            </Button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}

            <div className="ml-auto text-xs text-slate-500">
              {isFetching && !isLoading && <span>Updating...</span>}
            </div>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">Status</label>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-40 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="disposed">Disposed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">Condition</label>
                <Select value={conditionFilter} onValueChange={(v) => { setConditionFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-40 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All conditions</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {branches && branches.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-500">Branch</label>
                  <Select value={branchFilter} onValueChange={(v) => { setBranchFilter(v); setPage(1) }}>
                    <SelectTrigger className="w-56 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All branches</SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">Treatment</label>
                <Select value={treatmentFilter} onValueChange={(v) => { setTreatmentFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-48 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All treatments</SelectItem>
                    <SelectItem value="capitalized">Capitalized</SelectItem>
                    <SelectItem value="expensed">Expensed</SelectItem>
                    <SelectItem value="tracked_non_capitalized">Tracked</SelectItem>
                    <SelectItem value="pending_review">Pending review</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">Category</label>
                <input
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
                  placeholder="e.g. Laptop"
                  className="h-9 w-40 rounded-lg border border-slate-200 px-3 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600">Failed to load assets. Please refresh.</p>
          </div>
        ) : showEmptyStateFirstTime ? (
          <EmptyState
            icon={Package}
            title="No assets yet"
            description="Start by adding your first asset or importing your existing register from Excel."
            action={
              <div className="flex gap-2">
                <RoleGuard permission="assets.import">
                  <Link href="/assets/import">
                    <Button variant="outline">
                      <Upload className="w-4 h-4" />
                      Import Excel
                    </Button>
                  </Link>
                </RoleGuard>
                <RoleGuard permission="assets.create">
                  <Link href="/assets/new">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4" />
                      Add first asset
                    </Button>
                  </Link>
                </RoleGuard>
              </div>
            }
          />
        ) : showNoResults ? (
          <EmptyState
            icon={Search}
            title="No matching assets"
            description="Try adjusting your filters or search query."
            action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={(checked) => {
                          const next: Record<string, Asset> = { ...selected }
                          assets.forEach((asset) => {
                            if (checked) next[asset.id] = asset
                            else delete next[asset.id]
                          })
                          setSelected(next)
                        }}
                        aria-label="Select page"
                      />
                    </th>
                    <SortableHeader label="Asset" column="name" sortBy={sortBy} sortOrder={sortOrder} onToggle={toggleSort} />
                    <SortableHeader label="Tag" column="assetTag" sortBy={sortBy} sortOrder={sortOrder} onToggle={toggleSort} />
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Condition</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Branch</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Assigned</th>
                    <SortableHeader label="Cost" column="purchaseCost" sortBy={sortBy} sortOrder={sortOrder} onToggle={toggleSort} align="right" />
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Treatment</th>
                    <th className="w-10 px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assets.map((asset) => (
                    <tr
                      key={asset.id}
                      onClick={() => router.push('/assets/' + asset.id)}
                      className="hover:bg-slate-50/70 transition-colors duration-100 group cursor-pointer"
                    >
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={Boolean(selected[asset.id])}
                          onCheckedChange={(checked) => {
                            setSelected((prev) => {
                              const next = { ...prev }
                              if (checked) next[asset.id] = asset
                              else delete next[asset.id]
                              return next
                            })
                          }}
                          aria-label={`Select ${asset.assetTag}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">{asset.name}</div>
                            {asset.category && (
                              <div className="text-xs text-slate-500 truncate">{asset.category}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">{asset.assetTag}</td>
                      <td className="px-6 py-4"><StatusBadge status={asset.status} /></td>
                      <td className="px-6 py-4"><ConditionBadge condition={asset.condition} /></td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {asset.branch?.name ?? '-'}
                      </td>
                      <td className="px-6 py-4">
                        {asset.assignedUser ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar name={asset.assignedUser.fullName} size="sm" />
                            <span className="text-sm text-slate-700 truncate max-w-[120px]">
                              {asset.assignedUser.fullName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium text-right">
                        {asset.purchaseCost ? formatCurrency(asset.purchaseCost) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {asset.accountingTreatment && <TreatmentBadge treatment={asset.accountingTreatment} />}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-200 rounded-md">
                            <MoreHorizontal className="w-4 h-4 text-slate-500" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push('/assets/' + asset.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <RoleGuard permission="assets.edit">
                              <DropdownMenuItem onClick={() => router.push('/assets/' + asset.id + '/edit')}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            </RoleGuard>
                            <RoleGuard permission="assets.transfer">
                              <DropdownMenuItem
                                disabled={asset.status === 'disposed'}
                                onClick={() => router.push('/assets/' + asset.id + '/transfer')}
                              >
                                <ArrowLeftRight className="w-4 h-4 mr-2" />
                                Transfer
                              </DropdownMenuItem>
                            </RoleGuard>
                            <RoleGuard permission="assets.dispose">
                              <DropdownMenuItem
                                disabled={asset.status === 'disposed'}
                                onClick={() => setAssetToDispose(asset)}
                              >
                                <TrendingDown className="w-4 h-4 mr-2" />
                                Dispose
                              </DropdownMenuItem>
                            </RoleGuard>
                            <RoleGuard permission="assets.delete">
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                onClick={() => setAssetToDelete(asset)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </RoleGuard>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-500">
                  Showing <span className="font-medium text-slate-700">{(page - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium text-slate-700">{Math.min(page * pageSize, total)}</span> of{' '}
                  <span className="font-medium text-slate-700">{total}</span>
                </div>
                <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <div className="px-3 text-sm text-slate-500">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(assetToDelete)}
        onOpenChange={(open) => !open && setAssetToDelete(null)}
        title={'Delete ' + (assetToDelete?.name ?? 'asset')}
        description="This will move the asset to the deleted state. You can restore it later from the audit view."
        confirmLabel="Delete asset"
        variant="destructive"
        isLoading={deleteAsset.isPending}
        onConfirm={handleDelete}
      />

      {assetToDispose && (
        <DisposeAssetModal
          asset={assetToDispose}
          open={Boolean(assetToDispose)}
          onOpenChange={(open) => { if (!open) setAssetToDispose(null) }}
        />
      )}

      <BulkTransferDialog
        open={bulkTransferOpen}
        onOpenChange={setBulkTransferOpen}
        assetIds={transferableSelected.map((asset) => asset.id)}
        onDone={clearSelection}
      />

      <BulkDisposeDialog
        open={bulkDisposeOpen}
        onOpenChange={setBulkDisposeOpen}
        assets={transferableSelected}
        onDone={clearSelection}
      />

      <ConfirmDialog
        open={Boolean(bulkStatus)}
        onOpenChange={(open) => !open && setBulkStatus(null)}
        title={bulkStatus === 'maintenance' ? 'Mark as maintenance' : 'Mark as active'}
        description={`Update status for ${selectedIds.length} selected asset${selectedIds.length === 1 ? '' : 's'}. Disposed assets will be skipped.`}
        confirmLabel={bulkStatus === 'maintenance' ? 'Set maintenance' : 'Set active'}
        variant="default"
        isLoading={bulkStatusUpdate.isPending}
        onConfirm={handleBulkStatus}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selectedIds.length} asset${selectedIds.length === 1 ? '' : 's'}`}
        description="This moves the selected assets to the deleted state. You can restore them later from the audit view. Disposed assets will be skipped."
        confirmLabel="Delete selected"
        variant="destructive"
        isLoading={bulkDelete.isPending}
        onConfirm={handleBulkDelete}
      />
    </div>
  )
}

interface SortableHeaderProps {
  label: string
  column: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onToggle: (col: string) => void
  align?: 'left' | 'right'
}

function SortableHeader({ label, column, sortBy, sortOrder, onToggle, align = 'left' }: SortableHeaderProps) {
  const isActive = sortBy === column
  return (
    <th className={'px-6 py-3 ' + (align === 'right' ? 'text-right' : 'text-left')}>
      <button
        onClick={() => onToggle(column)}
        className={'inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors ' + (isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700')}
      >
        {label}
        <ArrowUpDown className={'w-3 h-3 ' + (isActive ? 'opacity-100' : 'opacity-40')} />
      </button>
    </th>
  )
}
