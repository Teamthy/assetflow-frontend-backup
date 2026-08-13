'use client'

import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { formResolver } from '@/lib/validations/form-resolver'
import { TrendingDown, Loader2, Calculator } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  recordDepreciationSchema,
  type RecordDepreciationFormValues,
} from '@/lib/validations/asset'
import { useRecordDepreciation } from '@/lib/hooks/useAssets'
import { formatCurrency } from '@/lib/utils/format'
import type { Asset } from '@/types'

interface Props {
  asset: Asset
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DepreciationModal({ asset, open, onOpenChange }: Props) {
  const recordMutation = useRecordDepreciation(asset.id)
  const currentYear = new Date().getFullYear()

  const form = useForm<RecordDepreciationFormValues>({
    resolver: formResolver(recordDepreciationSchema),
    defaultValues: {
      fiscalYear: currentYear,
      depreciationMethod: 'straight_line',
      periodUsedPriorYears: 0,
      periodUsedCurrentYear: 12,
      accumulatedDepreciationBf: 0,
      yearlyDepCharge: 0,
      totalAccumulatedDepreciation: 0,
      runDate: new Date().toISOString().split('T')[0],
    },
  })

  const watched = form.watch()

  const calc = useMemo(() => {
    const cost = asset.purchaseCost ?? 0
    const residual = asset.residualValue ?? 0
    const depBase = cost - residual
    const lifeMonths = asset.expectedUsefulLifeMonths ?? 0
    const bf = Number(watched.accumulatedDepreciationBf) || 0
    const charge = Number(watched.yearlyDepCharge) || 0
    const total = bf + charge
    const nbv = cost - total
    let suggested = 0
    if (watched.depreciationMethod === 'straight_line' && lifeMonths > 0 && depBase > 0) {
      suggested = (depBase / lifeMonths) * (Number(watched.periodUsedCurrentYear) || 12)
    }
    return {
      depBase, total, nbv, suggested,
      totalMatches: Math.abs(total - (Number(watched.totalAccumulatedDepreciation) || 0)) < 0.01,
    }
  }, [
    asset.purchaseCost, asset.residualValue, asset.expectedUsefulLifeMonths,
    watched.accumulatedDepreciationBf, watched.yearlyDepCharge,
    watched.totalAccumulatedDepreciation, watched.depreciationMethod,
    watched.periodUsedCurrentYear,
  ])

  async function onSubmit(values: RecordDepreciationFormValues) {
    const yearlyDepCharge = Number(values.yearlyDepCharge ?? 0)
    const accumulatedDepreciationBf = Number(values.accumulatedDepreciationBf ?? 0)
    const total = Math.round((accumulatedDepreciationBf + yearlyDepCharge) * 100) / 100
    try {
      await recordMutation.mutateAsync({
        fiscalYear: Number(values.fiscalYear),
        depreciationMethod: values.depreciationMethod ?? 'straight_line',
        periodUsedPriorYears: Number(values.periodUsedPriorYears ?? 0),
        periodUsedCurrentYear: Number(values.periodUsedCurrentYear ?? 12),
        accumulatedDepreciationBf,
        yearlyDepCharge,
        totalAccumulatedDepreciation: total,
        runDate: values.runDate ?? new Date().toISOString().split('T')[0],
      })
      form.reset()
      onOpenChange(false)
    } catch { /* handled by hook */ }
  }

  if (asset.accountingTreatment !== 'capitalized' || !asset.isDepreciable) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Cannot Record Depreciation</DialogTitle>
            <DialogDescription>
              Depreciation can only be recorded for capitalized, depreciable assets.
              This asset is classified as <strong>{asset.accountingTreatment}</strong>.
              Capitalization needs purchase cost of at least ₦50,000 and useful life of at least 12 months.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            <Button onClick={() => onOpenChange(false)} className="w-full">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) form.reset(); onOpenChange(o) }}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <DialogTitle>Record Depreciation</DialogTitle>
              <DialogDescription>
                {asset.name} · Cost: {formatCurrency(asset.purchaseCost)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-3 border-b border-slate-100 grid grid-cols-3 gap-3 bg-slate-50/50 text-center">
          {[
            { label: 'Depreciable Base', value: formatCurrency(calc.depBase) },
            { label: 'Accumulated',      value: formatCurrency(calc.total)   },
            { label: 'Net Book Value',   value: formatCurrency(calc.nbv)     },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-[11px] text-slate-500">{s.label}</p>
              <p className="text-sm font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="fiscalYear" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiscal Year *</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="depreciationMethod" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? 'straight_line'}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="straight_line">Straight Line</SelectItem>
                        <SelectItem value="reducing_balance">Reducing Balance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="periodUsedPriorYears" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period — Prior Years (months)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="periodUsedCurrentYear" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period — Current Year (months)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="accumulatedDepreciationBf" render={({ field }) => (
                <FormItem>
                  <FormLabel>Accumulated Depreciation B/F (₦)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="yearlyDepCharge" render={({ field }) => (
                <FormItem>
                  <FormLabel>Yearly Depreciation Charge (₦)</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input type="number" step="0.01" {...field} className="flex-1" />
                      {calc.suggested > 0 && (
                        <Button
                          type="button" variant="outline" size="sm"
                          onClick={() => {
                            const rounded = Math.round(calc.suggested * 100) / 100
                            form.setValue('yearlyDepCharge', rounded)
                            const bf = Number(form.getValues('accumulatedDepreciationBf')) || 0
                            form.setValue('totalAccumulatedDepreciation', Math.round((bf + rounded) * 100) / 100)
                          }}
                          className="flex-shrink-0 gap-1 text-xs"
                        >
                          <Calculator className="w-3 h-3" />
                          {formatCurrency(calc.suggested)}
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="totalAccumulatedDepreciation" render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Accumulated Depreciation (₦)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormDescription>
                    Must equal B/F + Yearly Charge = {formatCurrency(calc.total)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="runDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Run Date *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={recordMutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={recordMutation.isPending}
                className="bg-brand-600 hover:bg-brand-700 text-white"
              >
                {recordMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Record Depreciation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
