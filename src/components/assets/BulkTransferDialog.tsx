'use client'

import { useForm } from 'react-hook-form'
import { ArrowLeftRight, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

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
import { formResolver } from '@/lib/validations/form-resolver'
import { transferAssetSchema, type TransferAssetFormValues } from '@/lib/validations/asset'
import { useBulkTransfer } from '@/lib/hooks/useBulkAssets'
import { useBranches } from '@/lib/hooks/useBranches'
import { usersApi } from '@/lib/api/users'
import type { Branch } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  assetIds: string[]
  onDone?: (processedIds: string[]) => void
}

export function BulkTransferDialog({ open, onOpenChange, assetIds, onDone }: Props) {
  const { data: branchData, isLoading: loadingBranches } = useBranches()
  const branches: Branch[] = (branchData?.data ?? branchData?.items ?? []) as Branch[]
  const { data: members = [] } = useQuery({
    queryKey: ['users', 'transfer'],
    queryFn: () => usersApi.list(),
  })
  const transfer = useBulkTransfer()

  const form = useForm<TransferAssetFormValues>({
    resolver: formResolver(transferAssetSchema),
    defaultValues: { toBranchId: '', toUserId: '', reason: '' },
  })

  async function onSubmit(values: TransferAssetFormValues) {
    try {
      const result = await transfer.mutateAsync({
        assetIds,
        toBranchId: values.toBranchId?.trim() || undefined,
        toUserId: values.toUserId?.trim() || undefined,
        reason: values.reason,
      })
      const processed = [...(result.successful ?? []), ...(result.submittedForApproval ?? [])]
      form.reset()
      onDone?.(processed)
      onOpenChange(false)
    } catch {
      // toast from hook
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Transfer {assetIds.length} asset{assetIds.length === 1 ? '' : 's'}</DialogTitle>
              <DialogDescription>
                Move the selected assets to a branch and/or assignee.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 px-6 py-5">
              <FormField
                control={form.control}
                name="toBranchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New branch</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'no-change' ? '' : value)}
                      value={field.value || 'no-change'}
                      disabled={loadingBranches}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no-change">No change</SelectItem>
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
                    <Select
                      onValueChange={(value) => field.onChange(value === 'unassigned' ? '' : value)}
                      value={field.value || 'unassigned'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {members.filter((member) => member.userId).map((member) => (
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
                      <Textarea rows={3} placeholder="Explain why these assets are being transferred..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={transfer.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={transfer.isPending} className="bg-blue-600 text-white hover:bg-blue-700">
                {transfer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Transfer {assetIds.length}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
