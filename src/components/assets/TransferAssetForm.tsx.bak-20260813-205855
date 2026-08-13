'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftRight, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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

interface TransferAssetFormProps {
  asset: Asset
  onSuccess?: () => void
  onCancel?: () => void
  submitLabel?: string
}

export function TransferAssetForm({ asset, onSuccess, onCancel, submitLabel = 'Transfer Asset' }: TransferAssetFormProps) {
  const { data: branchData, isLoading: loadingBranches } = useBranches()
  const transferMutation = useTransferAsset(asset.id)

  const branches: Branch[] = (branchData?.data ?? branchData?.items ?? []) as Branch[]
  const { data: members = [] } = useQuery({ queryKey: ['users', 'transfer'], queryFn: usersApi.list })
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
      onSuccess?.()
    } catch {
      // error handled by hook
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <ArrowLeftRight className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">Transfer asset</h3>
          <p className="mt-1 text-sm text-slate-600">
            Move {asset.name} to another branch or user.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Current branch</div>
            <div className="font-medium text-slate-900">{asset.branch?.name ?? 'Unassigned'}</div>
          </div>
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Current assignee</div>
            <div className="font-medium text-slate-900">{asset.assignedUser?.fullName ?? 'Unassigned'}</div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="toBranchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New branch</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={loadingBranches}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">No change</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                        {branch.code ? ` (${branch.code})` : ''}
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
                  <Textarea rows={3} placeholder="Explain why this asset is being transferred..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={transferMutation.isPending}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={transferMutation.isPending} className="bg-brand-600 text-white hover:bg-brand-700">
              {transferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
