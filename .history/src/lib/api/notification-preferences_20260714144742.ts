import apiClient from './client'

export interface NotificationPreference {
    key: string
    label: string
    description: string
    inApp: boolean
    email: boolean
}

function unwrapEnvelope<T>(response: unknown): T {
    if (response && typeof response === 'object' && 'data' in response) {
        const payload = (response as { data?: unknown }).data
        return (payload as T) ?? (response as T)
    }
    return response as T
}

function normalizePreferences(data: unknown): NotificationPreference[] {
    if (Array.isArray(data)) return data as NotificationPreference[]

    if (data && typeof data === 'object') {
        const record = data as Record<string, unknown>
        const rawPreferences = record.preferences
        if (Array.isArray(rawPreferences)) return rawPreferences as NotificationPreference[]

        const nested = record.data
        if (Array.isArray(nested)) return nested as NotificationPreference[]
        if (nested && typeof nested === 'object') {
            const nestedRecord = nested as Record<string, unknown>
            const nestedPreferences = nestedRecord.preferences
            if (Array.isArray(nestedPreferences)) return nestedPreferences as NotificationPreference[]
        }
    }

    return []
}

export const notificationPreferencesApi = {
    get: async (): Promise<NotificationPreference[]> => {
        const r = await apiClient.get<unknown>('/notification-preferences')
        const payload = unwrapEnvelope<unknown>(r.data)
        return normalizePreferences(payload)
    },

    update: async (preferences: NotificationPreference[]): Promise<NotificationPreference[]> => {
        const r = await apiClient.patch<unknown>('/notification-preferences', { preferences })
        const payload = unwrapEnvelope<unknown>(r.data)
        return normalizePreferences(payload)
    },
}
