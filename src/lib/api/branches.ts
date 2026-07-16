import apiClient from './client'
import type {
  Branch,
  PaginatedResponse,
  CreateBranchDto,
  UpdateBranchDto,
} from '@/types'

export const branchApi = {
  list: (params?: { includeDeleted?: boolean; limit?: number }) =>
    apiClient.get<{ success: boolean; data: Branch[] }>('/branches', {
      params,
    }),

  get: (id: string) =>
    apiClient.get<{ success: boolean; data: Branch }>(`/branches/${id}`),

  create: (data: CreateBranchDto) =>
    apiClient.post<{ success: boolean; data: Branch }>('/branches', data),

  update: (id: string, data: UpdateBranchDto) =>
    apiClient.patch<{ success: boolean; data: Branch }>(
      `/branches/${id}`,
      data
    ),

  delete: (id: string, force?: boolean) =>
    apiClient.delete<{ success: boolean }>(
      `/branches/${id}${force ? '?force=true' : ''}`
    ),

  getAssets: (
    id: string,
    params?: { limit?: number; page?: number; status?: string }
  ) =>
    apiClient.get<{ success: boolean; data: PaginatedResponse<unknown> }>(
      `/branches/${id}/assets`,
      { params }
    ),
}
