'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { SettingsSection } from '@/components/shared/SettingsSection'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { notificationPreferencesApi, type NotificationPreference } from '@/lib/api/notification-preferences'
import { getApiErrorMessage } from '@/lib/api/errors'

const defaultPrefs: NotificationPreference[] = [
  { key: 'asset_assigned', label: 'Asset assigned to me', description: 'When an asset is assigned to you', inApp: true, email: true },
  { key: 'asset_transferred', label: 'Asset transferred', description: 'When an asset is transferred to or from you', inApp: true, email: true },
  { key: 'maintenance_assigned', label: 'Maintenance task assigned', description: 'New maintenance tasks assigned to you', inApp: true, email: true },
  { key: 'maintenance_due', label: 'Maintenance due soon', description: 'Reminders 48 hours before due date', inApp: true, email: true },
  { key: 'maintenance_overdue', label: 'Maintenance overdue', description: 'Alerts when tasks pass their due date', inApp: true, email: true },
  { key: 'warranty_expiring', label: 'Warranty expiring', description: 'Notifications 30 and 7 days before expiry', inApp: true, email: false },
  { key: 'asset_disposed', label: 'Asset disposed', description: 'When any organization asset is disposed', inApp: true, email: false },
  { key: 'depreciation_recorded', label: 'Depreciation recorded', description: 'When depreciation snapshots are added', inApp: true, email: false },
  { key: 'system', label: 'System alerts', description: 'Important updates and announcements', inApp: true, email: true },
]

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<NotificationPreference[]>(defaultPrefs)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const latestPrefs = useRef(prefs)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    latestPrefs.current = prefs
  }, [prefs])

  useEffect(() => {
    async function loadPrefs() {
      try {
        const data = await notificationPreferencesApi.get()
        if (data.length > 0) {
          setPrefs(data)
        }
      } catch {
        toast.error('Unable to load notification preferences')
      } finally {
        setLoading(false)
      }
    }

    loadPrefs()
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  async function persist(next: NotificationPreference[], silent = false) {
    setSaving(true)
    try {
      const saved = await notificationPreferencesApi.update(next)
      if (saved.length > 0) setPrefs(saved)
      if (!silent) toast.success('Preferences saved')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update notification preferences'))
    } finally {
      setSaving(false)
    }
  }

  function toggle(key: string, channel: 'inApp' | 'email') {
    const next = prefs.map((pref) =>
      pref.key === key ? { ...pref, [channel]: !pref[channel] } : pref
    )
    setPrefs(next)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      void persist(latestPrefs.current, true)
    }, 400)
  }

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Notification preferences"
        description="Choose how you want to be notified"
        icon={Bell}
      >
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-sm text-slate-500">Loading your preferences…</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Notification type</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-24">In-app</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-24">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prefs.map((pref) => (
                  <tr key={pref.key}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900">{pref.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{pref.description}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <Switch checked={pref.inApp} onCheckedChange={() => toggle(pref.key, 'inApp')} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <Switch checked={pref.email} onCheckedChange={() => toggle(pref.key, 'email')} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            {saving ? 'Saving…' : 'Changes save automatically. Email delivery requires a verified sender address.'}
          </p>
          <Button
            variant="outline"
            onClick={() => void persist(prefs)}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : 'Sync preferences'}
          </Button>
        </div>
      </SettingsSection>
    </div>
  )
}
