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
  list: (params?: AssetListParams) =>
    apiClient.get<{ success: boolean; data: PaginatedResponse<Asset> }>(
      '/assets',
      { params }
    ),

  get: (id: string) =>
    apiClient.get<{ success: boolean; data: Asset }>(`/assets/${id}`),

  create: (data: CreateAssetDto) =>
    apiClient.post<{ success: boolean; data: Asset }>('/assets', data),

  update: (id: string, data: UpdateAssetDto) =>
    apiClient.patch<{ success: boolean; data: Asset }>(`/assets/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/assets/${id}`),

  restore: (id: string, data: RestoreAssetDto) =>
    apiClient.post<{ success: boolean; data: Asset }>(
      `/assets/${id}/restore`,
      data
    ),

  transfer: (id: string, data: TransferAssetDto) =>
    apiClient.post<{
      success: boolean
      data: { updatedAsset: Asset; transferRecord: unknown }
    }>(`/assets/${id}/transfer`, data),

  dispose: (id: string, data: DisposeAssetDto) =>
    apiClient.post<{
      success: boolean
      data: { asset: Asset; disposal: unknown }
    }>(`/assets/${id}/dispose`, data),

  depreciate: (id: string, data: RecordDepreciationDto) =>
    apiClient.post<{ success: boolean; data: unknown }>(
      `/assets/${id}/depreciation`,
      data
    ),

  timeline: (
    id: string,
    params?: { page?: number; eventType?: string; limit?: number }
  ) =>
    apiClient.get<{ success: boolean; data: unknown }>(
      `/assets/${id}/timeline`,
      { params }
    ),

  audit: (params?: { includeDeleted?: boolean }) =>
    apiClient.get<{ success: boolean; data: unknown }>('/assets/audit', {
      params,
    }),

  export: async (params?: AssetListParams) => {
    const response = await apiClient.get('/assets/export', {
      params,
      responseType: 'blob',
    })
    return response.data as Blob
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
