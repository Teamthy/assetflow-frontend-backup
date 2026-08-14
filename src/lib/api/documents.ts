import apiClient from './client'

export interface DocumentRecord {
  id: string
  entityType?: string
  entityId?: string
  category?: string
  fileName?: string
  originalFileName?: string
  mimeType?: string
  fileSize?: number
  description?: string
  createdAt?: string
}

function unwrap<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data
  }
  return response as T
}

function asList(payload: unknown): DocumentRecord[] {
  const inner = unwrap<unknown>(payload)
  if (Array.isArray(inner)) return inner
  if (inner && typeof inner === 'object') {
    const record = inner as { data?: unknown; items?: unknown }
    if (Array.isArray(record.data)) return record.data as DocumentRecord[]
    if (Array.isArray(record.items)) return record.items as DocumentRecord[]
  }
  return []
}

export const documentsApi = {
  list: async (params?: { category?: string; entityType?: string }) => {
    const response = await apiClient.get('/documents', { params })
    return asList(response.data)
  },

  upload: async (input: {
    file: File
    entityType: string
    entityId: string
    category: string
    description?: string
  }) => {
    const form = new FormData()
    form.append('file', input.file)
    form.append('entityType', input.entityType)
    form.append('entityId', input.entityId)
    form.append('category', input.category)
    if (input.description) form.append('description', input.description)
    const response = await apiClient.post('/documents', form, {
      timeout: 120000,
    })
    return unwrap<DocumentRecord>(response.data)
  },

  download: async (id: string) => {
    const response = await apiClient.get(`/documents/${id}/download`, {
      responseType: 'blob',
    })
    return response.data as Blob
  },
}
