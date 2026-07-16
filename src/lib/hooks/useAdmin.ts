import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { orgSettingsApi, type UpdateOrganizationSettingsDto } from '@/lib/api/organization-settings'
import { invitationsApi, type InviteUserDto, type AcceptInvitationDto } from '@/lib/api/invitations'
import { usersApi } from '@/lib/api/users'
import { approvalsApi, type RequestDisposalApprovalDto, type RequestTransferApprovalDto, type ApprovalDecisionDto } from '@/lib/api/approvals'

interface ApiErrorResponse {
  response?: { data?: { message?: string } }
  message?: string
}

function getErrorMessage(err: unknown, fallback: string): string {
  const e = err as ApiErrorResponse
  return e?.response?.data?.message ?? e?.message ?? fallback
}

// -------- Organization settings --------

export const orgSettingsKeys = {
  all: ['org-settings'] as const,
}

export function useOrgSettings() {
  return useQuery({
    queryKey: orgSettingsKeys.all,
    queryFn: () => orgSettingsApi.get(),
  })
}

export function useUpdateOrgSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateOrganizationSettingsDto) => orgSettingsApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgSettingsKeys.all })
      toast.success('Settings updated')
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to update settings')),
  })
}

// -------- Invitations --------

export const invitationsKeys = {
  all: ['invitations'] as const,
  pending: () => [...invitationsKeys.all, 'pending'] as const,
  preview: (token: string) => [...invitationsKeys.all, 'preview', token] as const,
}

export function usePendingInvitations() {
  return useQuery({
    queryKey: invitationsKeys.pending(),
    queryFn: () => invitationsApi.listPending(),
  })
}

export function useInvitationPreview(token: string) {
  return useQuery({
    queryKey: invitationsKeys.preview(token),
    queryFn: () => invitationsApi.preview(token),
    enabled: Boolean(token),
    retry: false,
  })
}

export function useInviteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: InviteUserDto) => invitationsApi.invite(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invitationsKeys.pending() })
      qc.invalidateQueries({ queryKey: usersKeys.all })
      toast.success('Invitation sent')
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to send invitation')),
  })
}

export function useCancelInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => invitationsApi.cancel(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invitationsKeys.pending() })
      toast.success('Invitation cancelled')
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to cancel invitation')),
  })
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: (data: AcceptInvitationDto) => invitationsApi.accept(data),
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to accept invitation')),
  })
}

// -------- Users / Team --------

export const usersKeys = {
  all: ['users'] as const,
  members: () => [...usersKeys.all, 'members'] as const,
  roles: () => [...usersKeys.all, 'roles'] as const,
  userRoles: (userId: string) => [...usersKeys.all, 'user-roles', userId] as const,
}

export function useOrgMembers() {
  return useQuery({
    queryKey: usersKeys.members(),
    queryFn: () => usersApi.list(),
  })
}

export function useOrgRoles() {
  return useQuery({
    queryKey: usersKeys.roles(),
    queryFn: () => usersApi.listRoles(),
  })
}

export function useAssignRole(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roleId: string) => usersApi.assignRole(userId, roleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.all })
      toast.success('Role updated')
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to update role')),
  })
}

export function useRemoveRole(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roleId: string) => usersApi.removeRole(userId, roleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.all })
      toast.success('Role removed')
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to remove role')),
  })
}

export function useSuspendUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => usersApi.suspend(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.all })
      toast.success('User suspended')
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to suspend user')),
  })
}

export function useReactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => usersApi.reactivate(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.all })
      toast.success('User reactivated')
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to reactivate user')),
  })
}

// -------- Approvals --------

export const approvalsKeys = {
  all: ['approvals'] as const,
  pending: () => [...approvalsKeys.all, 'pending'] as const,
  forAsset: (assetId: string) => [...approvalsKeys.all, 'asset', assetId] as const,
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: approvalsKeys.pending(),
    queryFn: () => approvalsApi.listPending(),
  })
}

export function useAssetApprovals(assetId: string) {
  return useQuery({
    queryKey: approvalsKeys.forAsset(assetId),
    queryFn: () => approvalsApi.listForAsset(assetId),
    enabled: Boolean(assetId),
  })
}

export function useRequestDisposalApproval(assetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RequestDisposalApprovalDto) => approvalsApi.requestDisposal(assetId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: approvalsKeys.all })
      qc.invalidateQueries({ queryKey: ['assets', 'detail', assetId] })
      toast.success('Disposal submitted for approval')
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to submit for approval')),
  })
}

export function useDecideDisposal(approvalId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ApprovalDecisionDto) => approvalsApi.decideDisposal(approvalId, data),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: approvalsKeys.all })
      qc.invalidateQueries({ queryKey: ['assets'] })
      const label = variables.decision === 'approved' ? 'approved' : 'rejected'
      toast.success('Disposal ' + label)
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to decide approval')),
  })
}

export function useDecideTransfer(approvalId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ApprovalDecisionDto) => approvalsApi.decideTransfer(approvalId, data),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: approvalsKeys.all })
      qc.invalidateQueries({ queryKey: ['assets'] })
      const label = variables.decision === 'approved' ? 'approved' : 'rejected'
      toast.success('Transfer ' + label)
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to decide approval')),
  })
}
