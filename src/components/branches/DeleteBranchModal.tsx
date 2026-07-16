'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2, Building2, Package } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useDeleteBranch } from '@/lib/hooks/useBranches'
import { usePermission } from '@/lib/utils/permissions'
import type { Branch } from '@/types'

interface DeleteBranchModalProps {
  branch: Branch
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteBranchModal({ branch, open, onOpenChange }: DeleteBranchModalProps) {
  const deleteMutation = useDeleteBranch()
  const { role } = usePermission()
  const [forceDelete, setForceDelete] = useState(false)

  const hasAssets = (branch.assetCount ?? 0) > 0
  const isAdmin = role === 'primary_admin' || role === 'org_admin'
  const canForceDelete = hasAssets && isAdmin

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync({ id: branch.id, force: forceDelete })
      onOpenChange(false)
      setForceDelete(false)
    } catch {
      // toast in hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setForceDelete(false); onOpenChange(o) }}>
      <DialogContent className="max-w-md">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Delete {branch.name}</DialogTitle>
              <DialogDescription className="mt-1">
                {hasAssets
                  ? isAdmin
                    ? 'This branch has active assets. You can force delete but assets will be unassigned.'
                    : 'This branch has active assets. Transfer or reassign them before deleting.'
                  : 'Are you sure you want to delete this branch? You can restore it later.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {hasAssets && (
          <div className="px-6 pt-4">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2.5">
              <Package className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-semibold">{branch.assetCount} active asset{branch.assetCount === 1 ? '' : 's'} in this branch</p>
                <p className="mt-0.5">
                  {isAdmin
                    ? 'Assets will lose their branch assignment after force delete.'
                    : 'Contact an administrator or transfer the assets first.'}
                </p>
              </div>
            </div>

            {canForceDelete && (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 p-3">
                <Checkbox
                  id="force-delete"
                  checked={forceDelete}
                  onCheckedChange={(v) => setForceDelete(v === true)}
                />
                <label htmlFor="force-delete" className="text-xs text-slate-700 cursor-pointer select-none">
                  <span className="font-semibold text-red-700">Force delete this branch</span>
                  <span className="block text-slate-500 mt-0.5">
                    I understand that {branch.assetCount} asset{branch.assetCount === 1 ? ' will' : 's will'} become unassigned.
                  </span>
                </label>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={deleteMutation.isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={deleteMutation.isPending || (hasAssets && !isAdmin) || (hasAssets && !forceDelete)}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4" />
                {hasAssets && forceDelete ? 'Force delete' : 'Delete branch'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
