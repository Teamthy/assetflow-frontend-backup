import apiClient from './client'

export interface Approval {
  id: string
  organizationId: string
  assetId: string
  assetName?: string
  assetTag?: string
  requestType: 'disposal' | 'transfer'
  status: 'pending' | 'approved' | 'rejected'
  requestedByUserId: string
  requestedByName?: string
  requestedAt: string
  decidedByUserId?: string
  decidedAt?: string
  decisionReason?: string
  payload?: Record<string, unknown>
}

export interface RequestDisposalApprovalDto {
  method: 'sold' | 'donated' | 'scrapped' | 'lost' | 'written_off' | 'other'
  reason: string
  proceeds: number
  disposedAt: string
  notes?: string
}

export interface RequestTransferApprovalDto {
  toBranchId?: string
  toUserId?: string
  reason: string
}

export interface ApprovalDecisionDto {
  decision: 'approved' | 'rejected'
  decisionReason: string
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
    const items = r.data ?? r.items ?? r.approvals ?? []
    return Array.isArray(items) ? (items as T[]) : []
  }
  return []
}

export const approvalsApi = {
  listPending: async (): Promise<Approval[]> => {
    const r = await apiClient.get<unknown>('/approvals')
    return normalizeList<Approval>(unwrap<unknown>(r.data))
  },

  listForAsset: async (assetId: string): Promise<Approval[]> => {
    const r = await apiClient.get<unknown>('/approvals/assets/' + assetId)
    return normalizeList<Approval>(unwrap<unknown>(r.data))
  },

  requestDisposal: async (assetId: string, data: RequestDisposalApprovalDto): Promise<Approval> => {
    const r = await apiClient.post<unknown>('/approvals/assets/' + assetId + '/disposal', data)
    return unwrap<Approval>(r.data)
  },

  requestTransfer: async (assetId: string, data: RequestTransferApprovalDto): Promise<Approval> => {
    const r = await apiClient.post<unknown>('/approvals/assets/' + assetId + '/transfer', data)
    return unwrap<Approval>(r.data)
  },

  decideDisposal: async (approvalId: string, data: ApprovalDecisionDto): Promise<Approval> => {
    const r = await apiClient.patch<unknown>('/approvals/' + approvalId + '/disposal/decision', data)
    return unwrap<Approval>(r.data)
  },

  decideTransfer: async (approvalId: string, data: ApprovalDecisionDto): Promise<Approval> => {
    const r = await apiClient.patch<unknown>('/approvals/' + approvalId + '/transfer/decision', data)
    return unwrap<Approval>(r.data)
  },
}
