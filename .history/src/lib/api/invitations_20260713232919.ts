import apiClient from './client'

export interface Invitation {
  userId: string
  email: string
  firstName: string
  lastName: string
  status: string
  invitedByUserId: string
  invitedByName?: string
  invitedAt: string
  expiresAt: string
  inviteToken?: string
}

export interface InviteUserDto {
  email: string
  firstName: string
  lastName: string
  roleId?: string
}

export interface AcceptInvitationDto {
  token: string
  password: string
  firstName?: string
  lastName?: string
}

export interface InvitationPreview {
  email: string
  organizationName: string
  organizationSlug: string
  role?: string
  invitedByName?: string
}

export interface AcceptInvitationResponse {
  message: string
  user: {
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
  organization: {
    id: string
    name: string
    slug: string
  }
  accessToken: string
  refreshToken?: string
  role?: string
}

function unwrap<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response && 'success' in response) {
    return (response as { data: T }).data
  }
  return response as T
}

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const r = data as Record<string, unknown>
    const items = r.data ?? r.items ?? []
    return Array.isArray(items) ? (items as T[]) : []
  }
  return []
}

export const invitationsApi = {
  invite: async (data: InviteUserDto) => {
    const r = await apiClient.post<unknown>('/invitations', data)
    return unwrap<{ message: string; inviteeUserId: string; email: string; expiresAt: string }>(r.data)
  },

  listPending: async (): Promise<Invitation[]> => {
    const r = await apiClient.get<unknown>('/invitations')
    return normalizeList<Invitation>(unwrap<unknown>(r.data))
  },

  cancel: async (userId: string): Promise<void> => {
    await apiClient.delete('/invitations/' + userId)
  },

  preview: async (token: string): Promise<InvitationPreview> => {
    const r = await apiClient.get<unknown>('/invitations/preview/' + token)
    return unwrap<InvitationPreview>(r.data)
  },

  accept: async (data: AcceptInvitationDto): Promise<AcceptInvitationResponse> => {
    const r = await apiClient.post<unknown>('/invitations/accept', data)
    return unwrap<AcceptInvitationResponse>(r.data)
  },
}
