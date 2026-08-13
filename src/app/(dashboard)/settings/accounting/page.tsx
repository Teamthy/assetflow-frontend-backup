'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Landmark, Loader2, AlertCircle } from 'lucide-react'

import { SettingsSection } from '@/components/shared/SettingsSection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useOrgSettings, useUpdateOrgSettings } from '@/lib/hooks/useAdmin'

const policySchema = z.object({
  capitalizationThreshold: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid amount'),
  capitalizationCurrency: z.enum(['NGN', 'USD', 'EUR', 'GBP', 'KES', 'ZAR', 'GHS']),
  minimumUsefulLifeMonths: z.coerce.number().int().min(1).max(600),
  lowValueTreatment: z.enum(['track_non_capitalized', 'expense']),
  defaultDepreciationMethod: z.enum(['straight_line', 'reducing_balance']),
  defaultUsefulLifeYears: z.coerce.number().int().min(1).max(100).nullable(),
})

type PolicyForm = z.infer<typeof policySchema>

export default function AccountingSettingsPage() {
  const { data: settings, isLoading } = useOrgSettings()
  const updateMutation = useUpdateOrgSettings()

  const form = useForm<PolicyForm>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      capitalizationThreshold: '50000.00',
      capitalizationCurrency: 'NGN',
      minimumUsefulLifeMonths: 12,
      lowValueTreatment: 'track_non_capitalized',
      defaultDepreciationMethod: 'straight_line',
      defaultUsefulLifeYears: 5,
    },
  })

  useEffect(() => {
    if (settings) {
      form.reset({
        capitalizationThreshold: settings.capitalizationThreshold,
        capitalizationCurrency: settings.capitalizationCurrency as PolicyForm['capitalizationCurrency'],
        minimumUsefulLifeMonths: settings.minimumUsefulLifeMonths,
        lowValueTreatment: settings.lowValueTreatment,
        defaultDepreciationMethod: settings.defaultDepreciationMethod,
        defaultUsefulLifeYears: settings.defaultUsefulLifeYears ?? null,
      })
    }
  }, [settings, form])

  async function onSubmit(values: PolicyForm) {
    await updateMutation.mutateAsync({
      capitalizationThreshold: values.capitalizationThreshold,
      capitalizationCurrency: values.capitalizationCurrency,
      minimumUsefulLifeMonths: values.minimumUsefulLifeMonths,
      lowValueTreatment: values.lowValueTreatment,
      defaultDepreciationMethod: values.defaultDepreciationMethod,
      defaultUsefulLifeYears: values.defaultUsefulLifeYears,
    })
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Loading settings...</p>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Policy changes do not affect existing assets</p>
            <p className="text-sm text-amber-800 mt-0.5">
              Recognition decisions on existing assets remain unchanged. New assets will use the updated policy.
            </p>
          </div>
        </div>

        <SettingsSection
          title="Recognition thresholds"
          description="How assets are classified when created or imported"
          icon={Landmark}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="capitalizationThreshold" render={({ field }) => (
              <FormItem>
                <FormLabel>Capitalization threshold</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="50000.00"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Assets at or above this cost are capitalized</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="capitalizationCurrency" render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                    <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                    <SelectItem value="GHS">GHS - Ghanaian Cedi</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="minimumUsefulLifeMonths" render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum useful life (months)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="600"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Below this, assets are expensed</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="lowValueTreatment" render={({ field }) => (
              <FormItem>
                <FormLabel>Low value asset treatment</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="track_non_capitalized">Track as non-capitalized</SelectItem>
                    <SelectItem value="expense">Expense immediately</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Assets below threshold</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </SettingsSection>

        <SettingsSection
          title="Depreciation defaults"
          description="How new assets are depreciated by default"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="defaultDepreciationMethod" render={({ field }) => (
              <FormItem>
                <FormLabel>Default depreciation method</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="straight_line">Straight line</SelectItem>
                    <SelectItem value="reducing_balance">Reducing balance</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="defaultUsefulLifeYears" render={({ field }) => (
              <FormItem>
                <FormLabel>Default useful life (years)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="e.g. 5"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Optional. Used as suggestion for new assets.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </SettingsSection>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={updateMutation.isPending || !form.formState.isDirty}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : 'Save policy'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
