import apiClient from './client'

export interface BulkFailure {
  assetId: string
  reason: string
}

export interface BulkResult {
  successful: string[]
  failed: BulkFailure[]
  submittedForApproval?: string[]
}

function unwrap<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    const payload = (response as { data?: unknown }).data
    if (payload && typeof payload === 'object' && 'data' in payload && 'success' in payload) {
      return (payload as { data: T }).data
    }
    return payload as T
  }
  return response as T
}

export const bulkApi = {
  transfer: async (input: {
    assetIds: string[]
    toBranchId?: string
    toUserId?: string
    reason?: string
  }): Promise<BulkResult> => {
    const response = await apiClient.post('/bulk/assets/transfer', input)
    return unwrap<BulkResult>(response.data)
  },

  dispose: async (input: {
    assetIds: string[]
    method: 'sold' | 'donated' | 'scrapped' | 'lost' | 'written_off' | 'other'
    reason: string
    proceeds: number
    disposedAt: string
    notes?: string
  }): Promise<BulkResult> => {
    const response = await apiClient.post('/bulk/assets/dispose', input)
    return unwrap<BulkResult>(response.data)
  },

  updateStatus: async (input: {
    assetIds: string[]
    status: 'active' | 'maintenance'
    reason?: string
  }): Promise<BulkResult> => {
    const response = await apiClient.post('/bulk/assets/status', input)
    return unwrap<BulkResult>(response.data)
  },

  delete: async (input: { assetIds: string[]; reason?: string }): Promise<BulkResult> => {
    const response = await apiClient.post('/bulk/assets/delete', input)
    return unwrap<BulkResult>(response.data)
  },
}
