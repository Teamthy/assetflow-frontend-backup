import apiClient from './client'
import { invitationsApi } from './invitations'
import { orgSettingsApi } from './organization-settings'
import { usersApi } from './users'

function unwrap(response: { data?: unknown }) {
  const payload = response?.data as { data?: unknown } | unknown
  if (payload && typeof payload === 'object' && 'data' in (payload as object)) {
    return (payload as { data: unknown }).data
  }
  return payload
}

export const settingsApi = {
  getOrganization: () => orgSettingsApi.get(),

  updateOrganization: (data: Record<string, unknown>) =>
    orgSettingsApi.update(data),

  updateAccountingPolicy: (data: Record<string, unknown>) =>
    orgSettingsApi.update(data),

  getTeamMembers: async () => {
    const members = await usersApi.list()
    return { data: { data: members } }
  },

  inviteUser: (data: { email: string; role: string; firstName?: string; lastName?: string }) =>
    apiClient.post('/invitations', data),

  updateMemberRole: (userId: string, role: string) =>
    apiClient.patch(`/users/${userId}/role`, { role }),

  suspendMember: (userId: string) => usersApi.suspend(userId),

  reactivateMember: (userId: string) => usersApi.reactivate(userId),

  removeMember: (userId: string) => usersApi.remove(userId),

  transferOwnership: (input: { newOwnerId: string; password: string }) =>
    usersApi.transferOwnership(input),

  getPendingInvitations: async () => {
    const invites = await invitationsApi.listPending()
    return { data: { data: invites } }
  },

  resendInvitation: (userId: string) =>
    apiClient.post(`/invitations/${userId}/resend`),

  cancelInvitation: (userId: string) =>
    invitationsApi.cancel(userId),
}

export { unwrap }
