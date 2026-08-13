import apiClient from './client'

export interface AuditCampaign {
  id: string
  name: string
  description?: string
  status?: 'draft' | 'in_progress' | 'completed' | 'cancelled' | string
  branchName?: string
  totalAssetsExpected?: string | number
  totalVerified?: string | number
  totalMissing?: string | number
  totalDamaged?: string | number
  scheduledStartDate?: string
  scheduledEndDate?: string
  createdAt?: string
}

function unwrap<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data
  }
  return response as T
}

function asList(payload: unknown): AuditCampaign[] {
  const inner = unwrap<unknown>(payload)
  if (Array.isArray(inner)) return inner
  if (inner && typeof inner === 'object') {
    const record = inner as { data?: unknown; items?: unknown }
    if (Array.isArray(record.data)) return record.data as AuditCampaign[]
    if (Array.isArray(record.items)) return record.items as AuditCampaign[]
  }
  return []
}

export const auditApi = {
  listCampaigns: async () => {
    const response = await apiClient.get('/audit/campaigns')
    return asList(response.data)
  },

  createCampaign: async (input: { name: string; description?: string }) => {
    const response = await apiClient.post('/audit/campaigns', input)
    return unwrap<AuditCampaign>(response.data)
  },

  startCampaign: async (id: string) => {
    const response = await apiClient.post(`/audit/campaigns/${id}/start`, {
      autoPopulateAssets: true,
    })
    return unwrap<AuditCampaign>(response.data)
  },

  completeCampaign: async (id: string, notes?: string) => {
    const response = await apiClient.post(`/audit/campaigns/${id}/complete`, { notes })
    return unwrap<unknown>(response.data)
  },
}
