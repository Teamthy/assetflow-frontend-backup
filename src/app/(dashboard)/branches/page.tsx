'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, Building2, Search, MoreHorizontal, Edit, Trash2, Eye,
  Package,
} from 'lucide-react'

import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { RoleGuard } from '@/components/shared/RoleGuard'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useBranches } from '@/lib/hooks/useBranches'
import { CreateBranchModal } from '@/components/branches/CreateBranchModal'
import { EditBranchModal } from '@/components/branches/EditBranchModal'
import { DeleteBranchModal } from '@/components/branches/DeleteBranchModal'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { Branch } from '@/types'

export default function BranchesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editBranch, setEditBranch] = useState<Branch | null>(null)
  const [deleteBranch, setDeleteBranch] = useState<Branch | null>(null)

  const { data: branchResp, isLoading, error } = useBranches()
  const branches = branchResp?.data ?? branchResp?.items ?? []

  const filtered = branches.filter((b) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      b.name.toLowerCase().includes(q) ||
      (b.code?.toLowerCase() ?? '').includes(q) ||
      (b.description?.toLowerCase() ?? '').includes(q)
    )
  })

  const totalAssetCount = filtered.reduce((sum, b) => sum + (b.assetCount ?? 0), 0)

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader
        title="Branches"
        description={
          branches.length > 0
            ? branches.length + ' branches with ' + totalAssetCount + ' assets'
            : 'Manage your organization locations'
        }
        actions={
          <RoleGuard permission="branches.create">
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4" />
              Add branch
            </Button>
          </RoleGuard>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600">Failed to load branches</p>
          </div>
        ) : branches.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No branches yet"
            description="Add your first branch to start organizing assets by location. Branches represent physical or logical locations where your assets live."
            action={
              <RoleGuard permission="branches.create">
                <Button
                  onClick={() => setCreateOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                  Add first branch
                </Button>
              </RoleGuard>
            }
          />
        ) : (
          <>
            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
              <div className="max-w-md">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search branches..."
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No matching branches"
                description="Try a different search term."
                action={<Button variant="outline" onClick={() => setSearch('')}>Clear search</Button>}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Branch</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Code</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Description</th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Assets</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Created</th>
                      <th className="w-10 px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((branch) => (
                      <tr
                        key={branch.id}
                        onClick={() => router.push('/branches/' + branch.id)}
                        className="hover:bg-slate-50/70 transition-colors duration-100 group cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 truncate">{branch.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {branch.code ? (
                            <span className="text-sm text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded">{branch.code}</span>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 max-w-md">
                          <p className="text-sm text-slate-600 truncate">
                            {branch.description ?? <span className="text-slate-400">No description</span>}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5 text-sm">
                            <Package className="w-3.5 h-3.5 text-slate-400" />
                            <span className={cn(
                              'font-semibold',
                              (branch.assetCount ?? 0) > 0 ? 'text-slate-900' : 'text-slate-400'
                            )}>
                              {branch.assetCount ?? 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {formatDate(branch.createdAt)}
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-200 rounded-md">
                              <MoreHorizontal className="w-4 h-4 text-slate-500" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push('/branches/' + branch.id)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View details
                              </DropdownMenuItem>
                              <RoleGuard permission="branches.edit">
                                <DropdownMenuItem onClick={() => setEditBranch(branch)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit branch
                                </DropdownMenuItem>
                              </RoleGuard>
                              <RoleGuard permission="branches.delete">
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                  onClick={() => setDeleteBranch(branch)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete branch
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
            )}
          </>
        )}
      </div>

      <CreateBranchModal open={createOpen} onOpenChange={setCreateOpen} />
      {editBranch && (
        <EditBranchModal
          branch={editBranch}
          open={Boolean(editBranch)}
          onOpenChange={(o) => { if (!o) setEditBranch(null) }}
        />
      )}
      {deleteBranch && (
        <DeleteBranchModal
          branch={deleteBranch}
          open={Boolean(deleteBranch)}
          onOpenChange={(o) => { if (!o) setDeleteBranch(null) }}
        />
      )}
    </div>
  )
}
