import apiClient from './client'

export const settingsApi = {
  getOrganization: () =>
    apiClient.get('/settings/organization'),

  updateOrganization: (data: Record<string, unknown>) =>
    apiClient.patch('/settings/organization', data),

  updateAccountingPolicy: (data: Record<string, unknown>) =>
    apiClient.patch('/settings/accounting-policy', data),

  getTeamMembers: () =>
    apiClient.get('/settings/team'),

  inviteUser: (data: { email: string; role: string }) =>
    apiClient.post('/team/invite', data),

  updateMemberRole: (userId: string, role: string) =>
    apiClient.patch(`/settings/team/${userId}/role`, { role }),

  suspendMember: (userId: string) =>
    apiClient.patch(`/settings/team/${userId}/suspend`),

  reactivateMember: (userId: string) =>
    apiClient.patch(`/settings/team/${userId}/reactivate`),

  removeMember: (userId: string) =>
    apiClient.delete(`/settings/team/${userId}`),

  getPendingInvitations: () =>
    apiClient.get('/settings/team/invitations'),

  resendInvitation: (invitationId: string) =>
    apiClient.post(`/settings/team/invitations/${invitationId}/resend`),

  cancelInvitation: (invitationId: string) =>
    apiClient.delete(`/settings/team/invitations/${invitationId}`),
}
