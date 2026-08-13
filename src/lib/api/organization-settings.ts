import apiClient from './client'

export interface OrganizationSettings {
  id: string
  organizationId: string
  capitalizationThreshold: string
  capitalizationCurrency: string
  minimumUsefulLifeMonths: number
  lowValueTreatment: 'track_non_capitalized' | 'expense'
  defaultDepreciationMethod: 'straight_line' | 'reducing_balance'
  defaultUsefulLifeYears: number | null
  createdAt: string
  updatedAt: string
}

export interface UpdateOrganizationSettingsDto {
  capitalizationThreshold?: string
  capitalizationCurrency?: string
  minimumUsefulLifeMonths?: number
  lowValueTreatment?: 'track_non_capitalized' | 'expense'
  defaultDepreciationMethod?: 'straight_line' | 'reducing_balance'
  defaultUsefulLifeYears?: number | null
}

function unwrap<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response && 'success' in response) {
    return (response as { data: T }).data
  }
  return response as T
}

export const orgSettingsApi = {
  get: async (): Promise<OrganizationSettings> => {
    const r = await apiClient.get<unknown>('/organization-settings')
    return unwrap<OrganizationSettings>(r.data)
  },

  update: async (data: UpdateOrganizationSettingsDto): Promise<OrganizationSettings> => {
    const r = await apiClient.patch<unknown>('/organization-settings', data)
    return unwrap<OrganizationSettings>(r.data)
  },
}
