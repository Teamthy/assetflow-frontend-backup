'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Wrench, Loader2, Search, Package, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import {
  createMaintenanceSchema,
  type CreateMaintenanceFormValues,
} from '@/lib/validations/maintenance'
import { useCreateMaintenance } from '@/lib/hooks/useMaintenance'
import { useAssets } from '@/lib/hooks/useAssets'
import { cn } from '@/lib/utils'
import type { Asset, MaintenancePriority } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultAssetId?: string
}

const DEFAULT_PRIORITY: MaintenancePriority = 'medium'

export function CreateMaintenanceModal({ open, onOpenChange, defaultAssetId }: Props) {
  const createMutation = useCreateMaintenance()
  const [assetSearch, setAssetSearch] = useState('')
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false)

  const { data: assetData, isLoading: loadingAssets } = useAssets({
    limit: 20,
    search: assetSearch || undefined,
    status: 'active',
  })

  const assets: Asset[] = (assetData?.data ?? assetData?.items ?? []) as Asset[]

  const form = useForm<CreateMaintenanceFormValues>({
    resolver: zodResolver(createMaintenanceSchema),
    defaultValues: {
      assetId: defaultAssetId ?? '',
      title: '',
      description: '',
      priority: DEFAULT_PRIORITY,
      dueAt: '',
      assignedTo: '',
    },
  })

  const selectedAssetId = form.watch('assetId')
  const selectedAsset = useMemo(
    () => assets.find((a) => a.id === selectedAssetId),
    [assets, selectedAssetId]
  )

  async function onSubmit(values: CreateMaintenanceFormValues) {
    try {
      await createMutation.mutateAsync({
        assetId: values.assetId,
        title: values.title,
        description: values.description?.trim() || undefined,
        priority: (values.priority ?? DEFAULT_PRIORITY) as MaintenancePriority,
        dueAt: values.dueAt?.trim() || undefined,
        assignedTo: values.assignedTo?.trim() || undefined,
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
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wrench className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle>Create maintenance task</DialogTitle>
              <DialogDescription>
                Schedule work to be done on an asset.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Asset picker */}
              <FormField
                control={form.control}
                name="assetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset *</FormLabel>
                    <Popover
                      open={assetPopoverOpen}
                      onOpenChange={setAssetPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <button
                            type="button"
                            className={cn(
                              'flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all hover:border-slate-300 focus:outline-none focus:border-brand-500',
                              !field.value && 'text-slate-400'
                            )}
                          >
                            {selectedAsset ? (
                              <span className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-slate-400" />
                                <span className="font-medium text-slate-900">
                                  {selectedAsset.name}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {selectedAsset.assetTag}
                                </span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                Search assets...
                              </span>
                            )}
                          </button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-96 p-0" align="start">
                        <div className="p-2 border-b border-slate-100">
                          <div className="flex items-center gap-2 px-2">
                            <Search className="w-4 h-4 text-slate-400" />
                            <input
                              autoFocus
                              value={assetSearch}
                              onChange={(e) => setAssetSearch(e.target.value)}
                              placeholder="Search by name or tag..."
                              className="flex-1 text-sm outline-none py-1.5"
                            />
                          </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {loadingAssets ? (
                            <div className="flex justify-center py-6">
                              <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                            </div>
                          ) : assets.length === 0 ? (
                            <div className="py-6 text-center text-sm text-slate-400">
                              No active assets found
                            </div>
                          ) : (
                            assets.map((a) => (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => {
                                  field.onChange(a.id)
                                  setAssetPopoverOpen(false)
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                              >
                                <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-slate-900 truncate">
                                    {a.name}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {a.assetTag}
                                  </p>
                                </div>
                                {field.value === a.id && (
                                  <Check className="w-4 h-4 text-brand-600 flex-shrink-0" />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Replace air filter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Additional details..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? DEFAULT_PRIORITY}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-brand-600 hover:bg-brand-700 text-white"
              >
                {createMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Create Task
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
