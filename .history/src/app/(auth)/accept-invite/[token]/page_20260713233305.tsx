'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Loader2, AlertCircle, UserPlus, Building2,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { invitationsApi } from '@/lib/api/invitations'
import { useAuthStore } from '@/lib/stores/auth'
import type { UserRole } from '@/types'

interface InvitationDetails {
  email: string
  organizationName: string
  role: string
  invitedByName?: string
}

const acceptSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type AcceptForm = z.infer<typeof acceptSchema>

const roleLabels: Record<string, string> = {
  primary_admin: 'Primary Admin',
  org_admin: 'Organization Admin',
  asset_manager: 'Asset Manager',
  finance_user: 'Finance User',
  branch_manager: 'Branch Manager',
  maintenance_staff: 'Maintenance Staff',
  auditor: 'Auditor',
  standard_staff: 'Standard Staff',
}

export default function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)

  const form = useForm<AcceptForm>({
    resolver: zodResolver(acceptSchema),
    defaultValues: { firstName: '', lastName: '', password: '', confirmPassword: '' },
  })

  useEffect(() => {
    async function loadInvitation() {
      try {
        if (!token) {
          setError('This invitation link is invalid or has been used.')
          return
        }

        const preview = await invitationsApi.preview(token)
        setInvitation({
          email: preview.email,
          organizationName: preview.organizationName,
          role: preview.role ?? 'standard_staff',
          invitedByName: preview.invitedByName,
        })
      } catch {
        setError('Unable to validate this invitation. It may have expired.')
      } finally {
        setLoading(false)
      }
    }
    loadInvitation()
  }, [token])

  async function onSubmit(values: AcceptForm) {
    if (!invitation || !token) return
    setAccepting(true)
    try {
      const response = await invitationsApi.accept({
        token,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
      })

      setAuth({
        user: {
          id: response.user.id,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          fullName: [response.user.firstName, response.user.lastName].filter(Boolean).join(' ') || response.user.email,
          email: response.user.email,
          createdAt: new Date().toISOString(),
        },
        organization: {
          id: response.organization.id,
          name: response.organization.name,
          slug: response.organization.slug,
        },
        accessToken: response.accessToken,
        refreshToken: response.refreshToken ?? '',
        role: (response.role ?? 'standard_staff') as UserRole,
      })

      toast.success('Account created successfully')
      router.push('/dashboard')
    } catch {
      toast.error('Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Validating invitation...</p>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-7 h-7 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Invitation issue</h2>
        <p className="text-slate-500 text-sm mt-2 leading-relaxed max-w-sm mx-auto">
          {error || 'This invitation is not valid.'}
        </p>
        <div className="mt-8 space-y-2">
          <Link href="/login" className="block">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Go to sign in
            </Button>
          </Link>
          <p className="text-xs text-slate-400">
            Ask your administrator to send a new invitation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
          <UserPlus className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Join AssetFlow</h2>
        <p className="text-slate-500 text-sm mt-1.5">Complete your account to get started</p>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-500">You have been invited to</p>
            <p className="text-base font-semibold text-slate-900 truncate">{invitation.organizationName}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs text-slate-500">as</span>
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                {roleLabels[invitation.role] ?? invitation.role}
              </span>
              {invitation.invitedByName && (
                <span className="text-xs text-slate-500">by {invitation.invitedByName}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Email address</label>
            <Input value={invitation.email} disabled className="bg-slate-50" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField control={form.control} name="firstName" render={({ field }) => (
              <FormItem>
                <FormLabel>First name <span className="text-red-500">*</span></FormLabel>
                <FormControl><Input autoComplete="given-name" placeholder="Amaka" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="lastName" render={({ field }) => (
              <FormItem>
                <FormLabel>Last name <span className="text-red-500">*</span></FormLabel>
                <FormControl><Input autoComplete="family-name" placeholder="Okonkwo" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Password <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input type="password" placeholder="At least 8 characters" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="confirmPassword" render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input type="password" placeholder="Re-enter password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 mt-2"
            disabled={accepting}
          >
            {accepting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Accept and create account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-xs text-slate-500">
        By accepting, you agree to AssetFlow&apos;s terms of service
      </p>
    </div>
  )
}
