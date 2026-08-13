import apiClient from './client'
import { invitationsApi } from './invitations'
import { usersApi } from './users'

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
  listMembers: async (params?: { page?: number; limit?: number; search?: string }) => {
    const members = await usersApi.list()
    return {
      data: {
        data: members,
        pagination: {
          total: members.length,
          page: params?.page ?? 1,
          limit: params?.limit ?? members.length,
          totalPages: 1,
        },
      },
    }
  },

  listInvitations: async (params?: { page?: number; limit?: number }) => {
    const invitations = await invitationsApi.listPending()
    return {
      data: {
        data: invitations,
        pagination: {
          total: invitations.length,
          page: params?.page ?? 1,
          limit: params?.limit ?? invitations.length,
          totalPages: 1,
        },
      },
    }
  },

  invite: (data: { email: string; role: string }) =>
    apiClient.post('/invitations', data),

  updateRole: (memberId: string, role: string) =>
    apiClient.patch(`/users/${memberId}/role`, { role }),

  suspendMember: (memberId: string) =>
    apiClient.patch(`/users/${memberId}/suspend`),

  reactivateMember: (memberId: string) =>
    apiClient.patch(`/users/${memberId}/reactivate`),

  removeMember: (memberId: string) =>
    apiClient.delete(`/users/${memberId}`),

  cancelInvite: (inviteId: string) =>
    apiClient.delete(`/invitations/${inviteId}`),

  transferOwnership: (newOwnerId: string, password: string) =>
    apiClient.post('/users/transfer-ownership', { newOwnerId, password }),
}
