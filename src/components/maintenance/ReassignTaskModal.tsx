'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { X, Loader2, UserCheck } from 'lucide-react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { maintenanceApi } from '@/lib/api/maintenance'
import { teamApi } from '@/lib/api/team'
import type { TeamMember } from '@/lib/api/team'
import { maintenanceKeys } from '@/lib/hooks/useMaintenance'
import { toast } from 'sonner'
import { UserAvatar } from '@/components/shared/UserAvatar'

const ELIGIBLE_ROLES = ['admin', 'asset_manager', 'branch_manager', 'maintenance_staff']

const schema = z.object({
  assignedUserId: z.string().min(1, 'Please select a team member'),
})
type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  taskId: string
  currentAssigneeId?: string
}

export function ReassignTaskModal({ open, onClose, taskId, currentAssigneeId }: Props) {
  const queryClient = useQueryClient()

  const { data: memberResp } = useQuery({
    queryKey: ['team', 'members'],
    queryFn: () => teamApi.listMembers(),
    enabled: open,
  })

  // teamApi.listMembers() returns PaginatedTeam = { data: TeamMember[], ... }
  const members = (memberResp?.data ?? []) as TeamMember[]

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { assignedUserId: currentAssigneeId ?? '' },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      maintenanceApi.update(taskId, { assignedUserId: data.assignedUserId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() })
      toast.success('Task reassigned successfully')
      onClose()
    },
    onError: () => toast.error('Failed to reassign task'),
  })

  const eligibleMembers = members.filter(
    (m) => ELIGIBLE_ROLES.includes(m.role) && m.status === 'active'
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-slate-900">
                  Reassign Task
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 mt-0.5">
                  Select a team member to assign this task to
                </DialogDescription>
              </div>
            </div>
            <DialogClose className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </DialogClose>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <div className="px-6 pb-4">
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {eligibleMembers.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-brand-200 hover:bg-brand-50/30 cursor-pointer transition-all"
                >
                  <input
                    type="radio"
                    value={member.userId}
                    {...register('assignedUserId')}
                    className="sr-only"
                  />
                  <UserAvatar name={member.user?.fullName ?? ''} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {member.user?.fullName ?? member.userId}
                    </p>
                    <p className="text-xs text-slate-400 capitalize">
                      {member.role.replace('_', ' ')}
                    </p>
                  </div>
                </label>
              ))}
              {eligibleMembers.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">
                  No eligible team members
                </p>
              )}
            </div>
            {errors.assignedUserId && (
              <p className="text-xs text-red-500 mt-2">
                {errors.assignedUserId.message}
              </p>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg border border-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Reassign
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
