import apiClient from './client'
import type { MaintenanceTask, PaginatedResponse } from '@/types'

export interface MaintenanceListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  priority?: string
  assetId?: string
  assignedUserId?: string
  branchId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateMaintenanceDto {
  assetId: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  dueDate?: string
  dueAt?: string
  assignedUserId?: string
  assignedTo?: string
}

export interface UpdateMaintenanceDto {
  title?: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  status?: 'open' | 'in_progress' | 'completed' | 'cancelled'
  dueDate?: string
  dueAt?: string
  assignedUserId?: string
  assignedTo?: string
}

export interface CompleteMaintenanceDto {
  completionNote: string
  note?: string
  completedAt?: string
}

export const maintenanceApi = {
  list: (params?: MaintenanceListParams) =>
    apiClient.get<PaginatedResponse<MaintenanceTask>>('\/maintenance', { params }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<MaintenanceTask>(`\/maintenance\/${id}`).then((r) => r.data),

  create: (data: CreateMaintenanceDto) =>
    apiClient.post<MaintenanceTask>('\/maintenance', data).then((r) => r.data),

  update: (id: string, data: UpdateMaintenanceDto) =>
    apiClient.patch<MaintenanceTask>(`\/maintenance\/${id}`, data).then((r) => r.data),

  complete: (id: string, data: CompleteMaintenanceDto) =>
    apiClient.patch<MaintenanceTask>(`\/maintenance\/${id}\/complete`, data).then((r) => r.data),

  start: (id: string) =>
    apiClient.patch<MaintenanceTask>(`\/maintenance\/${id}`, { status: 'in_progress' }).then((r) => r.data),

  cancel: (id: string) =>
    apiClient.patch<MaintenanceTask>(`\/maintenance\/${id}`, { status: 'cancelled' }).then((r) => r.data),
}
