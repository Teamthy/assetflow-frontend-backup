import apiClient from './client'

export interface TeamMember {
  id: string
  userId: string
  role: string
  status: string
  user?: {
    fullName: string
    email: string
  }
}

export interface Invitation {
  id: string
  email: string
  role: string
  status: string
  createdAt: string
  expiresAt: string
}

export interface PaginatedTeam {
  data: TeamMember[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface PaginatedInvitations {
  data: Invitation[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const teamApi = {
  listMembers: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<PaginatedTeam>('/team/members', { params }),

  listInvitations: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedInvitations>('/team/invitations', { params }),

  invite: (data: { email: string; role: string }) =>
    apiClient.post('/invitations', data),

  updateRole: (memberId: string, role: string) =>
    apiClient.patch(`/team/members/${memberId}/role`, { role }),

  suspendMember: (memberId: string) =>
    apiClient.patch(`/team/members/${memberId}/suspend`),

  reactivateMember: (memberId: string) =>
    apiClient.patch(`/team/members/${memberId}/reactivate`),

  removeMember: (memberId: string) =>
    apiClient.delete(`/team/members/${memberId}`),

  cancelInvite: (inviteId: string) =>
    apiClient.delete(`/team/invitations/${inviteId}`),

  transferOwnership: (newOwnerId: string, password: string) =>
    apiClient.post('/team/transfer-ownership', { newOwnerId, password }),
}
