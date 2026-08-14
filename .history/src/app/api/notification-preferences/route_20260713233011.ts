import { NextResponse } from 'next/server'

const defaultPreferences = [
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

let storedPreferences = [...defaultPreferences]

export async function GET() {
  return NextResponse.json({ success: true, data: storedPreferences })
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const incoming = Array.isArray(body?.preferences) ? body.preferences : storedPreferences
    storedPreferences = incoming.map((item: Record<string, unknown>) => ({
      key: String(item.key ?? ''),
      label: String(item.label ?? ''),
      description: String(item.description ?? ''),
      inApp: Boolean(item.inApp),
      email: Boolean(item.email),
    }))

    return NextResponse.json({ success: true, data: storedPreferences, message: 'Notification preferences updated' })
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 })
  }
}
