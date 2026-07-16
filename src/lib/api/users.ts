import apiClient from './client'

export interface OrgMember {
  userId: string
  firstName: string
  lastName: string
  fullName?: string
  email: string
  status: 'active' | 'suspended' | 'invited'
  roles: Array<{ id: string; name: string }>
  joinedAt: string
  lastActiveAt?: string
}

export interface OrgRole {
  id: string
  name: string
  description?: string
  isReadOnly?: boolean
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

export const usersApi = {
  list: async (): Promise<OrgMember[]> => {
    const r = await apiClient.get<unknown>('/users')
    return normalizeList<OrgMember>(unwrap<unknown>(r.data))
  },

  listRoles: async (): Promise<OrgRole[]> => {
    const r = await apiClient.get<unknown>('/users/roles')
    return normalizeList<OrgRole>(unwrap<unknown>(r.data))
  },

  getUserRoles: async (userId: string) => {
    const r = await apiClient.get<unknown>('/users/' + userId + '/roles')
    return unwrap<unknown>(r.data)
  },

  assignRole: async (userId: string, roleId: string): Promise<void> => {
    await apiClient.post('/users/' + userId + '/roles', { roleId })
  },

  removeRole: async (userId: string, roleId: string): Promise<void> => {
    await apiClient.delete('/users/' + userId + '/roles/' + roleId)
  },

  suspend: async (userId: string): Promise<void> => {
    await apiClient.patch('/users/' + userId + '/suspend')
  },

  reactivate: async (userId: string): Promise<void> => {
    await apiClient.patch('/users/' + userId + '/reactivate')
  },
}
