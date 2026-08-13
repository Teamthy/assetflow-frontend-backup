'use client'

import { useForm } from 'react-hook-form'
import { formResolver } from '@/lib/validations/form-resolver'
import { RotateCcw, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { restoreAssetSchema, type RestoreAssetFormValues } from '@/lib/validations/asset'
import { useRestoreAsset } from '@/lib/hooks/useAssets'
import type { Asset } from '@/types'

interface Props {
  asset: Asset
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RestoreAssetModal({ asset, open, onOpenChange }: Props) {
  const restoreMutation = useRestoreAsset(asset.id)

  const form = useForm<RestoreAssetFormValues>({
    resolver: formResolver(restoreAssetSchema),
    defaultValues: { reason: '', targetStatus: 'active' },
  })

  async function onSubmit(values: RestoreAssetFormValues) {
    try {
      const nextStatus = (values.status ?? values.targetStatus ?? 'active') as 'active' | 'maintenance'
      await restoreMutation.mutateAsync({
        reason: values.reason,
        status: nextStatus,
        targetStatus: nextStatus,
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
      <DialogContent className="max-w-md">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle>Restore asset</DialogTitle>
              <DialogDescription>
                Restore {asset.name} to the active register.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-4">
              <FormField
                control={form.control}
                name="targetStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restore to status *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
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
                    <FormLabel>Reason for restoration *</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Explain why this asset is being restored..."
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
                  disabled={restoreMutation.isPending}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={restoreMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {restoreMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Restore Asset
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
