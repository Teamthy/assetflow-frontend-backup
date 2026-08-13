'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftRight, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel,
  FormMessage, FormDescription,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { transferAssetSchema, type TransferAssetFormValues } from '@/lib/validations/asset'
import { useTransferAsset } from '@/lib/hooks/useAssets'
import { useBranches } from '@/lib/hooks/useBranches'
import { usersApi } from '@/lib/api/users'
import { useQuery } from '@tanstack/react-query'
import type { Asset, Branch } from '@/types'

interface Props {
  asset: Asset
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransferAssetModal({ asset, open, onOpenChange }: Props) {
  const { data: branchData, isLoading: loadingBranches } = useBranches()
  const transferMutation = useTransferAsset(asset.id)

  // branchData is PaginatedResponse<Branch>
  const branches: Branch[] = (branchData?.data ?? branchData?.items ?? []) as Branch[]
  const { data: members = [] } = useQuery({ queryKey: ['users', 'transfer-modal'], queryFn: usersApi.list, enabled: open })
  const currentBranchId = asset.branch?.id ?? ''

  const form = useForm<TransferAssetFormValues>({
    resolver: zodResolver(transferAssetSchema),
    defaultValues: { toBranchId: '', toUserId: '', reason: '' },
  })

  async function onSubmit(values: TransferAssetFormValues) {
    const newBranchId = values.toBranchId?.trim() || undefined
    const newUserId = values.toUserId?.trim() || undefined

    if (newBranchId && newBranchId === currentBranchId && !newUserId) {
      form.setError('toBranchId', {
        message: 'Asset is already in this branch. Choose a different branch or assignee.',
      })
      return
    }

    try {
      await transferMutation.mutateAsync({
        branchId: newBranchId,
        toUserId: newUserId,
        reason: values.reason,
      })
      form.reset()
      onOpenChange(false)
    } catch {
      // error handled by hook
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) form.reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Transfer asset</DialogTitle>
              <DialogDescription>
                Move {asset.name} to another branch or user.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Current branch</div>
              <div className="font-medium text-slate-900">
                {asset.branch?.name ?? 'Unassigned'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Current assignee</div>
              <div className="font-medium text-slate-900">
                {asset.assignedUser?.fullName ?? 'Unassigned'}
              </div>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-4">
              <FormField
                control={form.control}
                name="toBranchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New branch</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''}
                      disabled={loadingBranches}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No change</SelectItem>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                            {b.code ? ` (${b.code})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New assignee</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === 'unassigned' ? '' : value)} value={field.value || 'unassigned'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {members.map((member) => (
                          <SelectItem key={member.userId} value={member.userId}>
                            {`${member.firstName} ${member.lastName}`.trim() || member.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Optional custodian after transfer.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason *</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Explain why this asset is being transferred..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={transferMutation.isPending}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={transferMutation.isPending}
                className="bg-brand-600 hover:bg-brand-700 text-white"
              >
                {transferMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Transfer Asset
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

