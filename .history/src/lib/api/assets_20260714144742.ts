import apiClient from './client'
import type {
  Asset,
  PaginatedResponse,
  AssetListParams,
  CreateAssetDto,
  UpdateAssetDto,
  TransferAssetDto,
  DisposeAssetDto,
  RestoreAssetDto,
  RecordDepreciationDto,
} from '@/types'

export interface RecognitionSummaryItem {
  accountingTreatment: string
  count: number
}

export interface AuditSummaryRaw {
  totalAssets: number
  missingSerialNumberCount: number
  missingPurchaseDateCount: number
  missingCategoryCount: number
  disposedCount: number
  maintenanceCount: number
  recognitionSummary: RecognitionSummaryItem[]
}

export interface AuditSummary {
  summary: {
    totalAssets: number
    missingSerialNumber: number
    missingPurchaseDate: number
    missingCategory: number
    disposedCount: number
    maintenanceCount: number
    recognitionSummary: {
      capitalized: number
      expensed: number
      tracked_non_capitalized: number
      pending_review: number
    }
  }
}

function normalizeAudit(raw: unknown): AuditSummary {
  // Handle both { success, data: {...} } and direct shape
  const body = raw as Record<string, unknown>
  const d = (body.data && typeof body.data === 'object')
    ? (body.data as unknown) as AuditSummaryRaw
    : (raw as unknown) as AuditSummaryRaw

  // recognitionSummary is an array: [{accountingTreatment, count}]
  const rec: Record<string, number> = {}
  if (Array.isArray(d.recognitionSummary)) {
    for (const item of d.recognitionSummary) {
      rec[item.accountingTreatment] = Number(item.count)
    }
  } else if (d.recognitionSummary && typeof d.recognitionSummary === 'object') {
    // Already a flat object
    Object.assign(rec, d.recognitionSummary)
  }

  return {
    summary: {
      totalAssets: Number(d.totalAssets ?? 0),
      missingSerialNumber: Number(d.missingSerialNumberCount ?? (d as unknown as Record<string, unknown>).missingSerialNumber ?? 0),
      missingPurchaseDate: Number(d.missingPurchaseDateCount ?? (d as unknown as Record<string, unknown>).missingPurchaseDate ?? 0),
      missingCategory: Number(d.missingCategoryCount ?? (d as unknown as Record<string, unknown>).missingCategory ?? 0),
      disposedCount: Number(d.disposedCount ?? 0),
      maintenanceCount: Number(d.maintenanceCount ?? 0),
      recognitionSummary: {
        capitalized: rec.capitalized ?? 0,
        expensed: rec.expensed ?? 0,
        tracked_non_capitalized: rec.tracked_non_capitalized ?? 0,
        pending_review: rec.pending_review ?? 0,
      },
    },
  }
}

export interface AssetTimeline {
  asset: Asset
  lifecycle: { data: Record<string, unknown>[] }
  transfers: Record<string, unknown>[]
  maintenance: Record<string, unknown>[]
  depreciation: Record<string, unknown>[]
  disposals: Record<string, unknown>[]
}

export const assetApi = {
  list: (params?: AssetListParams) =>
    apiClient.get<PaginatedResponse<Asset>>('/assets', { params }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Asset>(`/assets/${id}`).then((r) => r.data),

  create: (data: CreateAssetDto) =>
    apiClient.post<Asset>('/assets', data).then((r) => r.data),

  update: (id: string, data: UpdateAssetDto) =>
    apiClient.patch<Asset>(`/assets/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/assets/${id}`).then((r) => r.data),

  restore: (id: string, data: RestoreAssetDto) =>
    apiClient.post(`/assets/${id}/restore`, data).then((r) => r.data),

  transfer: (id: string, data: TransferAssetDto) =>
    apiClient.post(`/assets/${id}/transfer`, data).then((r) => r.data),

  dispose: (id: string, data: DisposeAssetDto) =>
    apiClient.post(`/assets/${id}/dispose`, data).then((r) => r.data),

  depreciate: (id: string, data: RecordDepreciationDto) =>
    apiClient.post(`/assets/${id}/depreciation`, data).then((r) => r.data),

  timeline: (id: string, params?: { page?: number; eventType?: string }) =>
    apiClient.get<AssetTimeline>(`/assets/${id}/timeline`, { params }).then((r) => r.data),

  audit: (params?: { includeDeleted?: boolean }) =>
    apiClient.get('/assets/audit', { params }).then((r) => normalizeAudit(r.data)),

  export: (params?: AssetListParams) =>
    apiClient.get('/assets/export', { params, responseType: 'blob' }).then((r) => r.data as Blob),

  import: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/assets/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },
}
