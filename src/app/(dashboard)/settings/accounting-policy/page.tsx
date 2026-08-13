'use client'

import { useEffect, useState } from 'react'
import { Landmark, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { SettingsSection } from '@/components/shared/SettingsSection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { orgSettingsApi, type OrganizationSettings, type UpdateOrganizationSettingsDto } from '@/lib/api/organization-settings'

export default function AccountingPolicyPage() {
    const [settings, setSettings] = useState<OrganizationSettings | null>(null)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)

    const form = useForm<UpdateOrganizationSettingsDto>({
        defaultValues: {
            capitalizationThreshold: '',
            capitalizationCurrency: 'NGN',
            minimumUsefulLifeMonths: 12,
            lowValueTreatment: 'track_non_capitalized',
            defaultDepreciationMethod: 'straight_line',
            defaultUsefulLifeYears: 5,
        },
    })

    useEffect(() => {
        async function load() {
            try {
                const data = await orgSettingsApi.get()
                setSettings(data)
                form.reset({
                    capitalizationThreshold: data.capitalizationThreshold,
                    capitalizationCurrency: data.capitalizationCurrency,
                    minimumUsefulLifeMonths: data.minimumUsefulLifeMonths,
                    lowValueTreatment: data.lowValueTreatment,
                    defaultDepreciationMethod: data.defaultDepreciationMethod,
                    defaultUsefulLifeYears: data.defaultUsefulLifeYears,
                })
            } catch {
                toast.error('Unable to load accounting policy')
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [form])

    async function onSubmit(values: UpdateOrganizationSettingsDto) {
        setSaving(true)
        try {
            const updated = await orgSettingsApi.update(values)
            setSettings(updated)
            toast.success('Accounting policy updated')
        } catch {
            toast.error('Failed to update accounting policy')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <SettingsSection title="Accounting policy" description="Configure your organization’s capitalization and depreciation defaults" icon={Landmark}>
                {loading ? (
                    <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading accounting policy…</div>
                ) : (
                    <Form {...form}>
                        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField control={form.control} name="capitalizationThreshold" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Capitalization threshold</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="capitalizationCurrency" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Currency</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="minimumUsefulLifeMonths" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Minimum useful life (months)</FormLabel>
                                        <FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="defaultUsefulLifeYears" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Default useful life (years)</FormLabel>
                                        <FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="lowValueTreatment" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Low-value treatment</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="track_non_capitalized">Tracked non-capitalized</SelectItem>
                                                <SelectItem value="expense">Expensed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />

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
                            </div>

                            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">{settings ? `Last updated ${new Date(settings.updatedAt).toLocaleString()}` : 'Updates apply immediately to new assets.'}</p>
                                <Button type="submit" disabled={saving}>
                                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save policy'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </SettingsSection>
        </div>
    )
}
