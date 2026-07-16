export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'AssetFlow'
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'

export const ASSET_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  maintenance: 'Maintenance',
  disposed: 'Disposed',
}

export const ASSET_CONDITION_LABELS: Record<string, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
}

export const ACCOUNTING_TREATMENT_LABELS: Record<string, string> = {
  capitalized: 'Capitalized',
  expensed: 'Expensed',
  tracked_non_capitalized: 'Tracked (Non-Capitalized)',
  pending_review: 'Pending Review',
}

export const MAINTENANCE_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const MAINTENANCE_PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const DISPOSAL_METHOD_LABELS: Record<string, string> = {
  sold: 'Sold',
  donated: 'Donated',
  scrapped: 'Scrapped',
  lost: 'Lost',
  written_off: 'Written Off',
  other: 'Other',
}

export const DEPRECIATION_METHOD_LABELS: Record<string, string> = {
  straight_line: 'Straight Line',
  reducing_balance: 'Reducing Balance',
}

export const ITEMS_PER_PAGE = 25
export const MAX_IMPORT_ROWS = 10000
