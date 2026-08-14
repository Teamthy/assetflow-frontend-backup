'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { formResolver } from '@/lib/validations/form-resolver'
import { z } from 'zod'
import {
  User, Lock, Building2, Loader2, LogOut, ShieldAlert,
  Calendar, Mail,
} from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared/PageHeader'
import { SettingsSection } from '@/components/shared/SettingsSection'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form'
import { useAuthStore } from '@/lib/stores/auth'
import { authApi } from '@/lib/api/auth'
import { formatDate, formatDateTime } from '@/lib/utils/format'
import type { UserRole } from '@/types'
import { roleLabel as formatRoleLabel } from '@/lib/utils/roles'

const roleColors: Record<string, string> = {
  admin: 'bg-purple-50 text-purple-700 border-purple-200',
  asset_manager: 'bg-blue-50 text-blue-700 border-blue-200',
  finance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  branch_manager: 'bg-orange-50 text-orange-700 border-orange-200',
  maintenance_staff: 'bg-amber-50 text-amber-700 border-amber-200',
  auditor: 'bg-slate-100 text-slate-700 border-slate-200',
  standard_staff: 'bg-slate-50 text-slate-600 border-slate-200',
}

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
})

type ProfileFormValues = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type PasswordFormValues = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const organization = useAuthStore((s) => s.organization)
  const role = useAuthStore((s) => s.role) as UserRole
  const logout = useAuthStore((s) => s.logout)
  const updateUser = useAuthStore((s) => s.updateUser)

  const [logoutAllOpen, setLogoutAllOpen] = useState(false)
  const [logoutAllLoading, setLogoutAllLoading] = useState(false)

  const profileForm = useForm<ProfileFormValues>({
    resolver: formResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? user?.fullName?.split(' ')[0] ?? '',
      lastName: user?.lastName ?? user?.fullName?.split(' ').slice(1).join(' ') ?? '',
    },
  })

  const passwordForm = useForm<PasswordFormValues>({
    resolver: formResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  async function onProfileSubmit(values: ProfileFormValues) {
    // Update endpoint pending on backend; update local state
    updateUser({
      firstName: values.firstName,
      lastName: values.lastName,
      fullName: values.firstName + ' ' + values.lastName,
    })
    toast.success('Profile updated')
  }

  async function onPasswordSubmit(values: PasswordFormValues) {
    try {
      await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      passwordForm.reset()
      toast.success('Password changed successfully')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      toast.error(e?.response?.data?.message ?? e?.message ?? 'Failed to change password')
    }
  }

  async function handleLogoutAll() {
    setLogoutAllLoading(true)
    try {
      await authApi.logoutAll()
      logout()
      toast.success('Signed out from all devices')
      router.push('/login')
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast.error(e?.message ?? 'Failed to sign out')
      setLogoutAllLoading(false)
      setLogoutAllOpen(false)
    }
  }

  const roleLabel = role ? formatRoleLabel(role) : 'Member'
  const roleColorClass = role ? roleColors[role] : 'bg-slate-50 text-slate-600 border-slate-200'

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Your profile"
        description="Manage your personal information and account security"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Left: profile snapshot */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
            <div className="relative inline-block">
              <UserAvatar name={user?.fullName} size="lg" className="w-20 h-20 text-2xl mx-auto" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mt-4 truncate">{user?.fullName}</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{user?.email}</p>
            <span className={'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border mt-3 ' + roleColorClass}>
              {roleLabel}
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            {organization && (
              <InfoRow
                icon={Building2}
                label="Organization"
                value={organization.name}
              />
            )}
            <InfoRow
              icon={Mail}
              label="Email"
              value={user?.email ?? '-'}
              mono
            />
            {user?.createdAt && (
              <InfoRow
                icon={Calendar}
                label="Member since"
                value={formatDate(user.createdAt)}
              />
            )}
          </div>
        </div>

        {/* Right: forms */}
        <div className="space-y-6">
          <SettingsSection
            title="Personal information"
            description="Update your name and how you appear across AssetFlow"
            icon={User}
          >
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={profileForm.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input autoComplete="given-name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={profileForm.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input autoComplete="family-name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Email address</label>
                  <Input value={user?.email ?? ''} disabled className="bg-slate-50" />
                  <p className="text-xs text-slate-500">Contact your organization admin to change your email</p>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={profileForm.formState.isSubmitting}
                  >
                    {profileForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : 'Save changes'}
                  </Button>
                </div>
              </form>
            </Form>
          </SettingsSection>

          <SettingsSection
            title="Password"
            description="Change your account password"
            icon={Lock}
          >
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current password <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormDescription>At least 8 characters</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
                  Changing your password will keep you signed in on this device but sign you out from all other sessions.
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={passwordForm.formState.isSubmitting}
                  >
                    {passwordForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : 'Update password'}
                  </Button>
                </div>
              </form>
            </Form>
          </SettingsSection>

          <SettingsSection
            title="Active sessions"
            description="Manage where you are signed in"
            icon={ShieldAlert}
          >
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <ShieldAlert className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">Current session</p>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">
                          Active now
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Signed in {user?.createdAt ? formatDateTime(user.createdAt) : 'recently'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50/40 p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-red-900">Sign out from all devices</p>
                    <p className="text-xs text-red-800 mt-1 max-w-md">
                      If you suspect unauthorized access, sign out from all devices immediately. You will need to sign in again everywhere.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setLogoutAllOpen(true)}
                    className="border-red-300 text-red-700 hover:bg-red-50 flex-shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out everywhere
                  </Button>
                </div>
              </div>
            </div>
          </SettingsSection>
        </div>
      </div>

      <ConfirmDialog
        open={logoutAllOpen}
        onOpenChange={setLogoutAllOpen}
        title="Sign out from all devices?"
        description="You will be signed out here and everywhere else. Sign in again to continue."
        confirmLabel="Sign out everywhere"
        variant="destructive"
        isLoading={logoutAllLoading}
        onConfirm={handleLogoutAll}
      />
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-1" />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-slate-500">{label}</div>
        <div className={'text-sm text-slate-900 truncate ' + (mono ? 'font-mono' : '')}>{value}</div>
      </div>
    </div>
  )
}
