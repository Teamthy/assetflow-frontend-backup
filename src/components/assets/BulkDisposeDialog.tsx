'use client'

import { useForm } from 'react-hook-form'
import { AlertTriangle, Loader2, TrendingDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { disposeAssetSchema, type DisposeAssetFormValues } from '@/lib/validations/asset'
import { useBulkDispose } from '@/lib/hooks/useBulkAssets'
import { formatCurrency } from '@/lib/utils/format'
import type { Asset } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  assets: Asset[]
  onDone?: (processedIds: string[]) => void
}

const APPROVAL_THRESHOLD = 500_000

const DISPOSAL_METHODS = [
  { value: 'sold', label: 'Sold' },
  { value: 'donated', label: 'Donated' },
  { value: 'scrapped', label: 'Scrapped' },
  { value: 'lost', label: 'Lost' },
  { value: 'written_off', label: 'Written Off' },
  { value: 'other', label: 'Other' },
] as const

export function BulkDisposeDialog({ open, onOpenChange, assets, onDone }: Props) {
  const dispose = useBulkDispose()
  const needsApproval = assets.filter((asset) => Number(asset.purchaseCost ?? 0) >= APPROVAL_THRESHOLD).length

  const form = useForm<DisposeAssetFormValues>({
    resolver: formResolver(disposeAssetSchema),
    defaultValues: {
      method: 'sold',
      reason: '',
      proceeds: 0,
      disposedAt: new Date().toISOString().split('T')[0],
      approvedByUserId: '',
      notes: '',
    },
  })

  async function onSubmit(values: DisposeAssetFormValues) {
    try {
      const result = await dispose.mutateAsync({
        assetIds: assets.map((asset) => asset.id),
        method: values.method,
        reason: values.reason,
        proceeds: values.proceeds ?? 0,
        disposedAt: values.disposedAt,
        notes: values.notes?.trim() || undefined,
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
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-50">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Dispose {assets.length} asset{assets.length === 1 ? '' : 's'}</DialogTitle>
              <DialogDescription>
                Remove the selected assets from the active register.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="border-b border-slate-100 px-6 py-3">
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <div className="text-xs text-amber-800">
              <p className="font-semibold">This changes status to disposed.</p>
              {needsApproval > 0 && (
                <p className="mt-1">
                  {needsApproval} selected asset{needsApproval === 1 ? '' : 's'} cost {formatCurrency(APPROVAL_THRESHOLD)} or more
                  and will be sent for approval instead of disposing immediately.
                </p>
              )}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="max-h-[55vh] space-y-4 overflow-y-auto px-6 py-5">
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disposal method *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DISPOSAL_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
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
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason *</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Explain why these assets are being disposed..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proceeds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proceeds (₦)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormDescription>Applied to each selected asset. Enter 0 if none.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="disposedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disposal date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional notes</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Optional notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={dispose.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={dispose.isPending} className="bg-red-600 text-white hover:bg-red-700">
                {dispose.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {needsApproval === assets.length ? 'Submit for approval' : `Dispose ${assets.length}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
