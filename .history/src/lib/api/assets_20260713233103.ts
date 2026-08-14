import apiClient from './client'
import type {
  Asset,
  AssetListParams,
  CreateAssetDto,
  UpdateAssetDto,
  TransferAssetDto,
  DisposeAssetDto,
  RestoreAssetDto,
  RecordDepreciationDto,
  AssetAuditSummary,
  AssetTimelineEvent,
  PaginatedResult,
} from '@/types'

function unwrapEnvelope<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
    return (response as { data: T }).data
  }
  return response as T
}

function coerceAsset(raw: Record<string, unknown>): Asset {
  const num = (v: unknown): number | undefined => {
    if (v === null || v === undefined || v === '') return undefined
    const n = typeof v === 'string' ? parseFloat(v) : (v as number)
    return isNaN(n) ? undefined : n
  }

  return {
    ...(raw as unknown as Asset),
    purchaseCost: num(raw.purchaseCost),
    residualValue: num(raw.residualValue),
    expectedUsefulLifeMonths: raw.expectedUsefulLifeMonths as number | undefined,
    isDeleted: Boolean(raw.deletedAt),
  } as Asset
}

function normalizeAssetList(data: unknown): PaginatedResult<Asset> {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const r = data as Record<string, unknown>
    const items = (r.data ?? r.items ?? r.assets ?? []) as unknown
    const pagination = r.pagination as { page?: number; limit?: number; total?: number; totalPages?: number } | undefined

    return {
      items: Array.isArray(items) ? items.map((i) => coerceAsset(i as Record<string, unknown>)) : [],
      total: pagination?.total,
      page: pagination?.page,
      limit: pagination?.limit,
      totalPages: pagination?.totalPages,
    }
  }
  if (Array.isArray(data)) {
    return { items: data.map((i) => coerceAsset(i as Record<string, unknown>)) }
  }
  return { items: [] }
}

function formatLifecycleTitle(eventType: string): string {
  const map: Record<string, string> = {
    registered: 'Asset registered',
    updated: 'Asset details updated',
    transferred: 'Asset transferred',
    assigned: 'Asset assigned',
    status_changed: 'Status changed',
    condition_changed: 'Condition updated',
    disposed: 'Asset disposed',
    restored: 'Asset restored',
    depreciation_recorded: 'Depreciation recorded',
    deleted: 'Asset deleted',
  }
  return map[eventType] ?? eventType.replace(/_/g, ' ')
}

function buildFullUpdatePayload(asset: Asset, data: UpdateAssetDto): UpdateAssetDto {
  return {
    name: asset.name,
    description: asset.description,
    assetTag: asset.assetTag,
    serialNumber: asset.serialNumber,
    category: asset.category,
    manufacturer: asset.manufacturer,
    model: asset.model,
    branchId: asset.branchId ?? asset.branch?.id,
    assignedTo: asset.assignedTo ?? asset.assignedUser?.id,
    status: asset.status,
    condition: asset.condition,
    purchaseCost: asset.purchaseCost,
    purchaseDate: asset.purchaseDate,
    warrantyExpiryDate: asset.warrantyExpiryDate,
    expectedUsefulLifeMonths: asset.expectedUsefulLifeMonths,
    residualValue: asset.residualValue,
    isDepreciable: asset.isDepreciable,
    hasFutureEconomicBenefit: asset.hasFutureEconomicBenefit,
    costCanBeReliablyMeasured: asset.costCanBeReliablyMeasured,
    qrCodeUrl: asset.qrCodeUrl,
    ...data,
  }
}

export const assetApi = {
  list: async (params: AssetListParams = {}): Promise<PaginatedResult<Asset>> => {
    const r = await apiClient.get<unknown>('/assets', { params })
    return normalizeAssetList(unwrapEnvelope<unknown>(r.data))
  },

  get: async (id: string): Promise<Asset> => {
    const r = await apiClient.get<unknown>('/assets/' + id)
    return coerceAsset(unwrapEnvelope<Record<string, unknown>>(r.data))
  },

  create: async (data: CreateAssetDto): Promise<Asset> => {
    const r = await apiClient.post<unknown>('/assets', data)
    return coerceAsset(unwrapEnvelope<Record<string, unknown>>(r.data))
  },

  update: async (id: string, data: UpdateAssetDto): Promise<Asset> => {
    try {
      const r = await apiClient.patch<unknown>('/assets/' + id, data)
      return coerceAsset(unwrapEnvelope<Record<string, unknown>>(r.data))
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } }
      if (axiosError?.response?.status === 409) {
        const latestAsset = await assetApi.get(id)
        const retried = await apiClient.patch<unknown>('/assets/' + id, buildFullUpdatePayload(latestAsset, data))
        return coerceAsset(unwrapEnvelope<Record<string, unknown>>(retried.data))
      }
      throw error
    }
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete('/assets/' + id)
  },

  transfer: async (id: string, data: TransferAssetDto): Promise<Asset> => {
    const r = await apiClient.post<unknown>('/assets/' + id + '/transfer', data)
    const unwrapped = unwrapEnvelope<Record<string, unknown>>(r.data)
    const asset = (unwrapped.updatedAsset ?? unwrapped) as Record<string, unknown>
    return coerceAsset(asset)
  },

  dispose: async (id: string, data: DisposeAssetDto): Promise<Asset> => {
    const r = await apiClient.post<unknown>('/assets/' + id + '/dispose', data)
    const unwrapped = unwrapEnvelope<Record<string, unknown>>(r.data)
    const asset = (unwrapped.asset ?? unwrapped) as Record<string, unknown>
    return coerceAsset(asset)
  },

  restore: async (id: string, data: RestoreAssetDto): Promise<Asset> => {
    const r = await apiClient.post<unknown>('/assets/' + id + '/restore', data)
    const unwrapped = unwrapEnvelope<Record<string, unknown>>(r.data)
    const asset = (unwrapped.asset ?? unwrapped.updatedAsset ?? unwrapped) as Record<string, unknown>
    return coerceAsset(asset)
  },

  depreciate: async (id: string, data: RecordDepreciationDto): Promise<Asset> => {
    const r = await apiClient.post<unknown>('/assets/' + id + '/depreciation', data)
    const unwrapped = unwrapEnvelope<Record<string, unknown>>(r.data)
    const asset = (unwrapped.asset ?? unwrapped.updatedAsset ?? unwrapped) as Record<string, unknown>
    return coerceAsset(asset)
  },

  timeline: async (
    id: string,
    params?: { page?: number; limit?: number; eventType?: string }
  ): Promise<AssetTimelineEvent[]> => {
    const r = await apiClient.get<unknown>('/assets/' + id + '/timeline', { params })
    const unwrapped = unwrapEnvelope<Record<string, unknown>>(r.data)
    const events: AssetTimelineEvent[] = []

    const lifecycle = unwrapped.lifecycle as { data?: unknown[] } | undefined
    const lifecycleItems = lifecycle?.data ?? []
    if (Array.isArray(lifecycleItems)) {
      lifecycleItems.forEach((item) => {
        const it = item as Record<string, unknown>
        events.push({
          id: it.id as string,
          type: 'lifecycle',
          eventType: it.eventType as string,
          title: formatLifecycleTitle(it.eventType as string),
          description: it.description as string | undefined,
          createdAt: (it.occurredAt ?? it.createdAt) as string,
          metadata: it.metadata as Record<string, unknown> | undefined,
        })
      })
    }

    const transfers = unwrapped.transfers
    if (Array.isArray(transfers)) {
      transfers.forEach((item) => {
        const it = item as Record<string, unknown>
        events.push({
          id: 'transfer-' + it.id,
          type: 'transfer',
          eventType: 'asset_transferred',
          title: 'Asset transferred',
          description: it.reason as string | undefined,
          createdAt: (it.transferredAt ?? it.createdAt) as string,
          metadata: it as Record<string, unknown>,
        })
      })
    }

    const maintenance = unwrapped.maintenance
    if (Array.isArray(maintenance)) {
      maintenance.forEach((item) => {
        const it = item as Record<string, unknown>
        events.push({
          id: 'maint-' + it.id,
          type: 'maintenance',
          eventType: 'maintenance_' + (it.status as string),
          title: 'Maintenance: ' + (it.title as string),
          description: it.description as string | undefined,
          createdAt: it.createdAt as string,
          metadata: it as Record<string, unknown>,
        })
      })
    }

    const depreciation = unwrapped.depreciation
    if (Array.isArray(depreciation)) {
      depreciation.forEach((item) => {
        const it = item as Record<string, unknown>
        events.push({
          id: 'dep-' + it.id,
          type: 'depreciation',
          eventType: 'depreciation_recorded',
          title: 'Depreciation recorded for FY' + it.fiscalYear,
          description: 'Yearly charge: ' + it.yearlyDepCharge,
          createdAt: (it.runDate ?? it.createdAt) as string,
          metadata: it as Record<string, unknown>,
        })
      })
    }

    const disposals = unwrapped.disposals
    if (Array.isArray(disposals)) {
      disposals.forEach((item) => {
        const it = item as Record<string, unknown>
        events.push({
          id: 'disp-' + it.id,
          type: 'disposal',
          eventType: 'asset_disposed',
          title: 'Asset disposed via ' + (it.method as string),
          description: it.reason as string | undefined,
          createdAt: (it.disposedAt ?? it.createdAt) as string,
          metadata: it as Record<string, unknown>,
        })
      })
    }

    events.sort((a, b) => {
      const dA = new Date(a.createdAt).getTime()
      const dB = new Date(b.createdAt).getTime()
      return dB - dA
    })

    return events
  },

  audit: async (params?: { includeDeleted?: boolean }): Promise<AssetAuditSummary> => {
    const r = await apiClient.get<unknown>('/assets/audit', { params })
    return unwrapEnvelope<AssetAuditSummary>(r.data)
  },

  export: (params: AssetListParams = {}): Promise<Blob> =>
    apiClient
      .get('/assets/export', { params, responseType: 'blob' })
      .then((r) => r.data as Blob),

  import: (file: File): Promise<unknown> => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient
      .post<unknown>('/assets/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
}
