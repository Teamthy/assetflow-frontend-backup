'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Users, UserPlus, Mail, Loader2, MoreHorizontal, Shield,
  Ban, Trash2, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

import { SettingsSection } from '@/components/shared/SettingsSection'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/lib/stores/auth'
import { settingsApi } from '@/lib/api/settings'
import { formatDate } from '@/lib/utils/format'

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  role: z.enum([
    'org_admin',
    'asset_manager',
    'finance_user',
    'branch_manager',
    'maintenance_staff',
    'auditor',
    'standard_staff',
  ]),
})

type InviteFormValues = z.infer<typeof inviteSchema>

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

const roleColors: Record<string, string> = {
  primary_admin: 'bg-purple-50 text-purple-700 border-purple-200',
  org_admin: 'bg-purple-50 text-purple-700 border-purple-200',
  asset_manager: 'bg-blue-50 text-blue-700 border-blue-200',
  finance_user: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  branch_manager: 'bg-orange-50 text-orange-700 border-orange-200',
  maintenance_staff: 'bg-amber-50 text-amber-700 border-amber-200',
  auditor: 'bg-slate-100 text-slate-700 border-slate-200',
  standard_staff: 'bg-slate-50 text-slate-600 border-slate-200',
}

type TeamMember = {
  id: string
  fullName: string
  email: string
  role: string
  joinedAt?: string
  isCurrentUser?: boolean
}

type PendingInvite = {
  id: string
  email: string
  role: string
  sentAt: string
}

export default function TeamPage() {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [activeMembers, setActiveMembers] = useState<TeamMember[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)

  useEffect(() => {
    let mounted = true

    async function loadTeam() {
      try {
        const [membersResponse, invitesResponse] = await Promise.all([
          settingsApi.getTeamMembers(),
          settingsApi.getPendingInvitations(),
        ])

        const normalizedMembers = normalizeMembers(membersResponse?.data?.data ?? membersResponse?.data ?? membersResponse)
        const normalizedInvites = normalizeInvites(invitesResponse?.data?.data ?? invitesResponse?.data ?? invitesResponse)

        if (!mounted) return

        setActiveMembers(normalizedMembers.length > 0 ? normalizedMembers : getFallbackMembers(user, role))
        setPendingInvites(normalizedInvites)
      } catch {
        if (mounted) {
          setActiveMembers(getFallbackMembers(user, role))
          setPendingInvites([])
          toast.error('Unable to load team details right now')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    if (user) {
      loadTeam()
    } else {
      setLoading(false)
    }

    return () => {
      mounted = false
    }
  }, [role, user])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Team members</h2>
          <p className="text-sm text-slate-500 mt-1">{loading ? 'Loading team details…' : `${activeMembers.length} active, ${pendingInvites.length} pending`}</p>
        </div>
        <Button
          onClick={() => setInviteOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <UserPlus className="w-4 h-4" />
          Invite member
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 h-auto">
          <TabsTrigger value="active" className="data-[state=active]:bg-slate-100">
            Active members
            <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded font-semibold">
              {activeMembers.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-slate-100">
            Pending invitations
            {pendingInvites.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-semibold">
                {pendingInvites.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {activeMembers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No team members yet"
                description="Invite your teammates to collaborate on asset management."
                action={<Button onClick={() => setInviteOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white"><UserPlus className="w-4 h-4" />Invite member</Button>}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Member</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Role</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Joined</th>
                      <th className="w-10 px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={member.fullName} size="md" />
                            <div>
                              <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                {member.fullName}
                                {member.isCurrentUser && (
                                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">You</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ' + (roleColors[member.role] ?? roleColors.standard_staff)}>
                            {roleLabels[member.role] ?? member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {formatDate(member.joinedAt)}
                        </td>
                        <td className="px-6 py-4">
                          {!member.isCurrentUser && (
                            <DropdownMenu>
                              <DropdownMenuTrigger className="p-1.5 hover:bg-slate-100 rounded-md">
                                <MoreHorizontal className="w-4 h-4 text-slate-500" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Shield className="w-4 h-4 mr-2" />
                                  Change role
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Ban className="w-4 h-4 mr-2" />
                                  Suspend
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {pendingInvites.length === 0 ? (
              <EmptyState
                icon={Mail}
                title="No pending invitations"
                description="Invite team members to join your organization."
                action={<Button onClick={() => setInviteOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white"><UserPlus className="w-4 h-4" />Invite member</Button>}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Email</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Role</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Sent</th>
                      <th className="w-10 px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingInvites.map((invite) => (
                      <tr key={invite.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                              <Mail className="w-4 h-4 text-slate-400" />
                            </div>
                            <span className="text-sm font-medium text-slate-900">{invite.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ' + (roleColors[invite.role] ?? roleColors.standard_staff)}>
                            {roleLabels[invite.role] ?? invite.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{formatDate(invite.sentAt)}</td>
                        <td className="px-6 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="p-1.5 hover:bg-slate-100 rounded-md">
                              <MoreHorizontal className="w-4 h-4 text-slate-500" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Resend
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <InviteMemberModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvited={(invite) => setPendingInvites((prev) => [invite, ...prev])}
      />
    </div>
  )
}

function normalizeMembers(input: unknown): TeamMember[] {
  const items = Array.isArray(input)
    ? input
    : Array.isArray((input as { data?: unknown })?.data)
      ? ((input as { data: unknown[] }).data)
      : []

  return items.map((item, index: number) => {
    const member = item as Record<string, unknown>
    const nestedUser = member.user as Record<string, unknown> | undefined

    const fullName = getString(member, 'fullName') ?? getString(member, 'name') ?? [getString(member, 'firstName'), getString(member, 'lastName')].filter(Boolean).join(' ') || getString(nestedUser, 'fullName') || getString(nestedUser, 'firstName') || getString(member, 'email') || 'Team member'

    return {
      id: String(getString(member, 'id') ?? getString(member, 'userId') ?? getString(nestedUser, 'id') ?? `${index}`),
      fullName,
      email: String(getString(member, 'email') ?? getString(nestedUser, 'email') ?? ''),
      role: String(getString(member, 'role') ?? getString(nestedUser, 'role') ?? 'standard_staff'),
      joinedAt: getString(member, 'joinedAt') ?? getString(member, 'createdAt') ?? undefined,
      isCurrentUser: Boolean(getBoolean(member, 'isCurrentUser') ?? getBoolean(nestedUser, 'isCurrentUser') ?? false),
    }
  }).filter((member) => member.email || member.id)
}

function normalizeInvites(input: unknown): PendingInvite[] {
  const items = Array.isArray(input)
    ? input
    : Array.isArray((input as { data?: unknown })?.data)
      ? ((input as { data: unknown[] }).data)
      : []

  return items.map((item, index: number) => {
    const invite = item as Record<string, unknown>
    return {
      id: String(getString(invite, 'id') ?? `${getString(invite, 'email') ?? 'invite'}-${index}`),
      email: String(getString(invite, 'email') ?? ''),
      role: String(getString(invite, 'role') ?? 'standard_staff'),
      sentAt: String(getString(invite, 'sentAt') ?? getString(invite, 'createdAt') ?? new Date().toISOString()),
    }
  }).filter((invite) => invite.email)
}

function getFallbackMembers(user: { id: string; firstName?: string; lastName?: string; fullName?: string; email: string; createdAt?: string } | null, role: string | null): TeamMember[] {
  if (!user) return []
  return [{
    id: user.id,
    fullName: user.fullName ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
    email: user.email,
    role: role ?? 'primary_admin',
    joinedAt: user.createdAt,
    isCurrentUser: true,
  }]
}

function getString(source: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = source?.[key]
  if (typeof value === 'string') return value
  if (value === undefined || value === null) return undefined
  return String(value)
}

function getBoolean(source: Record<string, unknown> | undefined, key: string): boolean | undefined {
  const value = source?.[key]
  if (typeof value === 'boolean') return value
  return undefined
}

function InviteMemberModal({ open, onOpenChange, onInvited }: { open: boolean; onOpenChange: (o: boolean) => void; onInvited: (invite: PendingInvite) => void }) {
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'standard_staff' },
  })

  async function onSubmit(values: InviteFormValues) {
    try {
      const response = await settingsApi.inviteUser({ email: values.email, role: values.role })
      const payload = response?.data?.data ?? response?.data ?? response
      onInvited({
        id: payload?.id ?? `${values.email}-${values.role}`,
        email: values.email,
        role: values.role,
        sentAt: payload?.sentAt ?? payload?.createdAt ?? new Date().toISOString(),
      })
      toast.success('Invitation sent successfully')
      form.reset()
      onOpenChange(false)
    } catch {
      toast.error('Unable to send invitation right now')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Invite team member</DialogTitle>
              <DialogDescription>Send an invitation to join your organization</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address <span className="text-red-500">*</span></FormLabel>
                  <FormControl><Input type="email" placeholder="colleague@company.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="org_admin">Organization Admin</SelectItem>
                      <SelectItem value="asset_manager">Asset Manager</SelectItem>
                      <SelectItem value="finance_user">Finance User</SelectItem>
                      <SelectItem value="branch_manager">Branch Manager</SelectItem>
                      <SelectItem value="maintenance_staff">Maintenance Staff</SelectItem>
                      <SelectItem value="auditor">Auditor</SelectItem>
                      <SelectItem value="standard_staff">Standard Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Determines what this user can access</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : 'Send invitation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
