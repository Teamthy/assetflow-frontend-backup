import apiClient from './client'
import type {
  Asset,
  CreateAssetDto,
  UpdateAssetDto,
  AssetListParams,
  PaginatedResponse,
  TransferAssetDto,
  DisposeAssetDto,
  RestoreAssetDto,
  RecordDepreciationDto,
} from '@/types'

export const assetApi = {
  list: async (params?: AssetListParams) => {
    const response = await apiClient.get<{ success: boolean; data: PaginatedResponse<Asset> }>(
      '/assets',
      { params }
    )
    return response.data.data
  },

  get: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: Asset }>(`/assets/${id}`)
    return response.data.data
  },

  create: async (data: CreateAssetDto) => {
    const response = await apiClient.post<{ success: boolean; data: Asset }>('/assets', data)
    return response.data.data
  },

  update: async (id: string, data: UpdateAssetDto) => {
    const response = await apiClient.patch<{ success: boolean; data: Asset }>(`/assets/${id}`, data)
    return response.data.data
  },

  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/assets/${id}`),

  restore: async (id: string, data: RestoreAssetDto) => {
    const response = await apiClient.post<{ success: boolean; data: Asset }>(
      `/assets/${id}/restore`,
      data
    )
    return response.data.data
  },

  transfer: async (id: string, data: TransferAssetDto) => {
    const response = await apiClient.post<{
      success: boolean
      data: { updatedAsset: Asset; transferRecord: unknown }
    }>(`/assets/${id}/transfer`, data)
    return response.data.data
  },

  dispose: async (id: string, data: DisposeAssetDto) => {
    const response = await apiClient.post<{
      success: boolean
      data: { asset: Asset; disposal: unknown }
    }>(`/assets/${id}/dispose`, data)
    return response.data.data
  },

  depreciate: async (id: string, data: RecordDepreciationDto) => {
    const response = await apiClient.post<{ success: boolean; data: unknown }>(
      `/assets/${id}/depreciation`,
      data
    )
    return response.data.data
  },

  timeline: async (
    id: string,
    params?: { page?: number; eventType?: string; limit?: number }
  ) => {
    const response = await apiClient.get<{ success: boolean; data: unknown }>(
      `/assets/${id}/timeline`,
      { params }
    )
    return response.data.data
  },

  audit: async (params?: { includeDeleted?: boolean }) => {
    const response = await apiClient.get<{ success: boolean; data: unknown }>('/assets/audit', {
      params,
    })
    return response.data.data
  },

  export: async (params?: AssetListParams) => {
    const response = await apiClient.get('/assets/export', {
      params,
      responseType: 'blob',
    })
    return response.data as Blob
  },

  downloadTemplate: async () => {
    const response = await apiClient.get('/assets/import/template', {
      responseType: 'blob',
    })
    return response.data as Blob
  },

  qr: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: unknown }>(`/assets/${id}/qr`)
    return response.data.data
  },

  scan: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: unknown }>(`/assets/${id}/scan`)
    return response.data.data
  },

  import: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post<{ success: boolean; data: unknown }>(
      '/assets/import',
      formData,
      { headers: { 'Content-Type': undefined } }
    )
  },
}
