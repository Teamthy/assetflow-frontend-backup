'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Building2, Copy } from 'lucide-react'
import { toast } from 'sonner'

import { SettingsSection } from '@/components/shared/SettingsSection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form'
import { useAuthStore } from '@/lib/stores/auth'

export default function OrganizationSettingsPage() {
  const organization = useAuthStore((s) => s.organization)

  const form = useForm({
    defaultValues: {
      organizationName: organization?.name ?? '',
      organizationSlug: organization?.slug ?? '',
    },
  })

  useEffect(() => {
    if (organization) {
      form.reset({
        organizationName: organization.name,
        organizationSlug: organization.slug,
      })
    }
  }, [organization, form])

  function copyToClipboard(value: string, label: string) {
    navigator.clipboard.writeText(value)
    toast.success(label + ' copied')
  }

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Organization profile"
        description="Your organization identity"
        icon={Building2}
      >
        <div className="flex items-start gap-6 mb-6">
          <div className="w-20 h-20 rounded-xl bg-blue-100 flex items-center justify-center border-2 border-slate-100 flex-shrink-0">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 truncate">{organization?.name ?? 'Organization'}</h3>
            <p className="text-sm text-slate-500 mt-1">Slug: {organization?.slug ?? '-'}</p>
            <p className="text-xs text-slate-400 mt-2 max-w-md">
              To update the organization name, contact support. Configuration options are managed via Accounting Policy.
            </p>
          </div>
        </div>

        <Form {...form}>
          <div className="space-y-4">
            <FormField control={form.control} name="organizationName" render={({ field }) => (
              <FormItem>
                <FormLabel>Organization name</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input {...field} disabled className="bg-slate-50" />
                    <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(field.value, 'Name')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="organizationSlug" render={({ field }) => (
              <FormItem>
                <FormLabel>Organization slug</FormLabel>
                <FormControl>
                  <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50">
                    <span className="pl-3 text-sm text-slate-400">app.assetflow/</span>
                    <input
                      {...field}
                      disabled
                      className="flex-1 h-10 px-2 py-2.5 text-sm text-slate-900 bg-transparent focus:outline-none disabled:text-slate-500"
                    />
                    <Button type="button" variant="ghost" size="icon" className="mr-1" onClick={() => copyToClipboard(field.value, 'Slug')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </FormControl>
                <FormDescription>Used for organization login</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </Form>
      </SettingsSection>

      <SettingsSection title="Organization ID" description="Reference for API integrations">
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-slate-500">Organization ID</div>
            <div className="font-mono text-sm text-slate-900 mt-1 truncate">{organization?.id ?? '-'}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => organization?.id && copyToClipboard(organization.id, 'Organization ID')}
            className="flex-shrink-0"
          >
            <Copy className="w-4 h-4" />
            Copy
          </Button>
        </div>
      </SettingsSection>
    </div>
  )
}
