'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Package, MapPin, DollarSign, Settings2, AlertCircle } from 'lucide-react'

import { PageHeader } from '@/components/shared/PageHeader'
import { RecognitionPreview } from '@/components/assets/RecognitionPreview'
import { DetailSkeleton } from '@/components/shared/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createAssetSchema, type CreateAssetFormValues } from '@/lib/validations/asset'
import { useAsset, useUpdateAsset } from '@/lib/hooks/useAssets'
import { useBranches } from '@/lib/hooks/useBranches'
import { usePermission } from '@/lib/utils/permissions'
import type { UpdateAssetDto } from '@/types'
import { cn } from '@/lib/utils'

export default function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { can } = usePermission()

  const { data: asset, isLoading } = useAsset(id)
  const updateAsset = useUpdateAsset(id)
  const { data: branchResp, isLoading: loadingBranches } = useBranches()
  const branches = branchResp?.data ?? branchResp?.items ?? []

  const canEditFinancial = can('assets.view.financial') && can('assets.edit')
  const canEditCore = can('assets.edit')

  const form = useForm<CreateAssetFormValues>({
    resolver: zodResolver(createAssetSchema),
    values: asset ? {
      name: asset.name,
      description: asset.description ?? '',
      assetTag: asset.assetTag,
      serialNumber: asset.serialNumber ?? '',
      category: asset.category ?? '',
      manufacturer: asset.manufacturer ?? '',
      model: asset.model ?? '',
      branchId: asset.branch?.id ?? '',
      assignedTo: asset.assignedUser?.id ?? '',
      status: asset.status === 'disposed' ? 'active' : asset.status,
      condition: asset.condition,
      purchaseCost: asset.purchaseCost,
      purchaseDate: asset.purchaseDate ?? '',
      warrantyExpiryDate: asset.warrantyExpiryDate ?? '',
      expectedUsefulLifeMonths: asset.expectedUsefulLifeMonths,
      residualValue: asset.residualValue,
      isDepreciable: asset.isDepreciable,
      hasFutureEconomicBenefit: asset.hasFutureEconomicBenefit ?? true,
      costCanBeReliablyMeasured: asset.costCanBeReliablyMeasured ?? true,
    } as CreateAssetFormValues : undefined,
  })

  const watchedValues = form.watch()

  if (isLoading) return <DetailSkeleton />

  if (!asset) {
    return (
      <div className="max-w-5xl mx-auto">
        <Link href="/assets" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to assets
        </Link>
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-900">Asset not found</h2>
        </div>
      </div>
    )
  }

  const recognitionChanged =
    watchedValues.purchaseCost !== asset.purchaseCost ||
    watchedValues.expectedUsefulLifeMonths !== asset.expectedUsefulLifeMonths ||
    watchedValues.hasFutureEconomicBenefit !== asset.hasFutureEconomicBenefit ||
    watchedValues.costCanBeReliablyMeasured !== asset.costCanBeReliablyMeasured

  async function onSubmit(values: CreateAssetFormValues) {
    if (!asset) return

    const payload: UpdateAssetDto = {}

    if (canEditCore) {
      if (values.name !== asset.name) payload.name = values.name
      if (values.assetTag !== asset.assetTag) payload.assetTag = values.assetTag
      if ((values.description ?? '') !== (asset.description ?? '')) payload.description = values.description || undefined
      if ((values.serialNumber ?? '') !== (asset.serialNumber ?? '')) payload.serialNumber = values.serialNumber || undefined
      if ((values.category ?? '') !== (asset.category ?? '')) payload.category = values.category || undefined
      if ((values.manufacturer ?? '') !== (asset.manufacturer ?? '')) payload.manufacturer = values.manufacturer || undefined
      if ((values.model ?? '') !== (asset.model ?? '')) payload.model = values.model || undefined
      if (values.branchId !== (asset.branch?.id ?? asset.branchId ?? '')) payload.branchId = values.branchId || undefined
      if (values.assignedTo !== (asset.assignedUser?.id ?? asset.assignedTo ?? '')) payload.assignedTo = values.assignedTo || undefined
      if (values.status !== asset.status) payload.status = values.status
      if (values.condition !== asset.condition) payload.condition = values.condition
    }

    if (canEditFinancial) {
      if (values.purchaseCost !== asset.purchaseCost) payload.purchaseCost = values.purchaseCost
      if ((values.purchaseDate ?? '') !== (asset.purchaseDate ?? '')) payload.purchaseDate = values.purchaseDate || undefined
      if ((values.warrantyExpiryDate ?? '') !== (asset.warrantyExpiryDate ?? '')) payload.warrantyExpiryDate = values.warrantyExpiryDate || undefined
      if (values.expectedUsefulLifeMonths !== asset.expectedUsefulLifeMonths) payload.expectedUsefulLifeMonths = values.expectedUsefulLifeMonths
      if (values.residualValue !== asset.residualValue) payload.residualValue = values.residualValue
      if (values.hasFutureEconomicBenefit !== asset.hasFutureEconomicBenefit) payload.hasFutureEconomicBenefit = values.hasFutureEconomicBenefit
      if (values.costCanBeReliablyMeasured !== asset.costCanBeReliablyMeasured) payload.costCanBeReliablyMeasured = values.costCanBeReliablyMeasured
    }

    if (Object.keys(payload).length === 0) {
      router.push('/assets/' + id)
      return
    }

    try {
      await updateAsset.mutateAsync(payload)
      router.push('/assets/' + id)
    } catch {
      // toast handled in hook
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Link href={'/assets/' + id} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to asset
      </Link>

      <PageHeader
        title={'Edit ' + asset.name}
        description="Update asset details. Fields you do not have permission to edit are locked."
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <FormSection icon={Package} title="Basic information" description="Identify the asset in your register" locked={!canEditCore}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Asset name <span className="text-red-500">*</span></FormLabel>
                    <FormControl><Input disabled={!canEditCore} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="assetTag" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset tag <span className="text-red-500">*</span></FormLabel>
                    <FormControl><Input disabled={!canEditCore} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="serialNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial number</FormLabel>
                    <FormControl><Input disabled={!canEditCore} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl><Input disabled={!canEditCore} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="manufacturer" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer</FormLabel>
                    <FormControl><Input disabled={!canEditCore} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="model" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Model</FormLabel>
                    <FormControl><Input disabled={!canEditCore} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} disabled={!canEditCore} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </FormSection>

            <FormSection icon={MapPin} title="Location and assignment" description="Where is this asset and who owns it" locked={!canEditCore}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="branchId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={!canEditCore}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingBranches ? 'Loading...' : 'Select branch'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(!branches || branches.length === 0) ? (
                          <div className="px-3 py-2 text-sm text-slate-400">No branches available</div>
                        ) : branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="assignedTo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned to</FormLabel>
                    <FormControl>
                      <Input placeholder="User ID (optional)" disabled={!canEditCore} {...field} />
                    </FormControl>
                    <FormDescription>Use the Transfer action for better assignment</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!canEditCore}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Use Dispose action to mark as disposed</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="condition" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!canEditCore}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </FormSection>

            <FormSection icon={DollarSign} title="Financial information" description="Cost, dates, and depreciation" locked={!canEditFinancial}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="purchaseCost" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase cost</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₦</span>
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-7"
                          disabled={!canEditFinancial}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="residualValue" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Residual value</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₦</span>
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-7"
                          disabled={!canEditFinancial}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="purchaseDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase date</FormLabel>
                    <FormControl><Input type="date" disabled={!canEditFinancial} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="warrantyExpiryDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warranty expiry</FormLabel>
                    <FormControl><Input type="date" disabled={!canEditFinancial} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="expectedUsefulLifeMonths" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Expected useful life</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          disabled={!canEditFinancial}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">months</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </FormSection>

            <FormSection icon={Settings2} title="Recognition criteria" description="Determines if this asset is capitalized" locked={!canEditFinancial}>
              <div className="space-y-4">
                <FormField control={form.control} name="hasFutureEconomicBenefit" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                    <div>
                      <FormLabel className="text-sm font-medium text-slate-900">Has future economic benefit</FormLabel>
                      <FormDescription className="mt-0.5">Will this asset generate value in future periods?</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value ?? true} onCheckedChange={field.onChange} disabled={!canEditFinancial} />
                    </FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="costCanBeReliablyMeasured" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                    <div>
                      <FormLabel className="text-sm font-medium text-slate-900">Cost can be reliably measured</FormLabel>
                      <FormDescription className="mt-0.5">Do you have supporting documentation?</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value ?? true} onCheckedChange={field.onChange} disabled={!canEditFinancial} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
            </FormSection>
          </div>

          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {canEditFinancial && (
              <>
                <RecognitionPreview
                  input={{
                    purchaseCost: watchedValues.purchaseCost,
                    expectedUsefulLifeMonths: watchedValues.expectedUsefulLifeMonths,
                    hasFutureEconomicBenefit: watchedValues.hasFutureEconomicBenefit,
                    costCanBeReliablyMeasured: watchedValues.costCanBeReliablyMeasured,
                  }}
                />
                {recognitionChanged && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      Recognition-driving fields changed. The recognition decision will be re-evaluated on save.
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
              <Button
                type="submit"
                disabled={updateAsset.isPending || (!canEditCore && !canEditFinancial)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11"
              >
                {updateAsset.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving changes...
                  </>
                ) : 'Save changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push('/assets/' + id)}
                disabled={updateAsset.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}

function FormSection({
  icon: Icon,
  title,
  description,
  locked,
  children,
}: {
  icon: React.ElementType
  title: string
  description: string
  locked?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={cn('bg-white rounded-xl border shadow-sm overflow-hidden', locked ? 'border-slate-200 opacity-60' : 'border-slate-200')}>
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <Icon className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
          {locked && (
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Read only</span>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}
