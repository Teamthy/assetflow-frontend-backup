import apiClient from './client'

export const settingsApi = {
  getOrganization: () =>
    apiClient.get('/settings/organization'),

  updateOrganization: (data: Record<string, unknown>) =>
    apiClient.patch('/settings/organization', data),

  updateAccountingPolicy: (data: Record<string, unknown>) =>
    apiClient.patch('/settings/accounting-policy', data),

  getTeamMembers: () =>
    apiClient.get('/team'),

  inviteUser: (data: { email: string; role: string }) =>
    apiClient.post('/team/invitations', data),

  updateMemberRole: (userId: string, role: string) =>
    apiClient.patch(`/team/${userId}/role`, { role }),

  suspendMember: (userId: string) =>
    apiClient.patch(`/team/${userId}/suspend`),

  reactivateMember: (userId: string) =>
    apiClient.patch(`/team/${userId}/reactivate`),

  removeMember: (userId: string) =>
    apiClient.delete(`/team/${userId}`),

  getPendingInvitations: () =>
    apiClient.get('/team/invitations'),

  resendInvitation: (invitationId: string) =>
    apiClient.post(`/team/invitations/${invitationId}/resend`),

  cancelInvitation: (invitationId: string) =>
    apiClient.delete(`/team/invitations/${invitationId}`),
}
