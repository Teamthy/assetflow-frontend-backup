'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Search, Package, Building2, Wrench, LayoutDashboard,
  BarChart3, Settings, Bell, User, Plus, Upload, ArrowRight, QrCode,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { assetApi } from '@/lib/api/assets'
import { branchApi } from '@/lib/api/branches'
import { usePermission } from '@/lib/utils/permissions'
import { cn } from '@/lib/utils'
import { normalizeListResponse } from '@/lib/utils/list'
import type { Asset, Branch } from '@/types'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  href: string
  group: 'navigate' | 'create' | 'asset' | 'branch'
}

interface Props { open: boolean; onOpenChange: (open: boolean) => void }

const NAV_COMMANDS: CommandItem[] = [
  { id: 'nav-dashboard', label: 'Dashboard', description: 'Overview and metrics', icon: LayoutDashboard, href: '/dashboard', group: 'navigate' },
  { id: 'nav-assets', label: 'Assets', description: 'Asset register', icon: Package, href: '/assets', group: 'navigate' },
  { id: 'nav-scan', label: 'Scan asset', description: 'Look up a QR label or asset tag', icon: QrCode, href: '/assets/scan', group: 'navigate' },
  { id: 'nav-branches', label: 'Branches', description: 'Organization locations', icon: Building2, href: '/branches', group: 'navigate' },
  { id: 'nav-maintenance', label: 'Maintenance', description: 'Tasks and schedules', icon: Wrench, href: '/maintenance', group: 'navigate' },
  { id: 'nav-reports', label: 'Reports', description: 'Analytics and exports', icon: BarChart3, href: '/reports', group: 'navigate' },
  { id: 'nav-notifications', label: 'Notifications', description: 'Alerts and updates', icon: Bell, href: '/notifications', group: 'navigate' },
  { id: 'nav-settings', label: 'Settings', description: 'Organization and account', icon: Settings, href: '/settings', group: 'navigate' },
  { id: 'nav-profile', label: 'Profile', description: 'Your account', icon: User, href: '/profile', group: 'navigate' },
]

export function CommandPalette({ open, onOpenChange }: Props) {
  const router = useRouter()
  const { can } = usePermission()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => { if (!open) { setQuery(''); setActiveIndex(0) } }, [open])

  const { data: assetData } = useQuery({
    queryKey: ['cmdk', 'assets', debouncedQuery],
    queryFn: () => assetApi.list({ search: debouncedQuery, limit: 5 }),
    enabled: debouncedQuery.length >= 2 && open,
  })

  const { data: branchData } = useQuery({
    queryKey: ['cmdk', 'branches'],
    queryFn: () => branchApi.list(),
    enabled: open,
  })

  const assets = normalizeListResponse<Asset>(assetData)
  const branches = normalizeListResponse<Branch>(branchData)

  const createCommands: CommandItem[] = []
  if (can('assets.create')) {
    createCommands.push({ id: 'create-asset', label: 'Add Asset', description: 'Register a new asset', icon: Plus, href: '/assets/new', group: 'create' })
    createCommands.push({ id: 'import-assets', label: 'Import Assets', description: 'Import from Excel', icon: Upload, href: '/assets/import', group: 'create' })
  }
  if (can('branches.create')) {
    createCommands.push({ id: 'create-branch', label: 'Add Branch', description: 'Create a new branch', icon: Plus, href: '/branches/new', group: 'create' })
  }

  const q = query.toLowerCase()
  const filtered = NAV_COMMANDS.filter(
    (c) => !q || c.label.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
  )
  const filteredCreate = createCommands.filter(
    (c) => !q || c.label.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
  )

  const assetItems: CommandItem[] = assets.map((a) => ({
    id: `asset-${a.id}`, label: a.name, description: a.assetTag, icon: Package, href: `/assets/${a.id}`, group: 'asset' as const,
  }))
  const branchItems: CommandItem[] = branches.filter((b) =>
    !q || b.name.toLowerCase().includes(q)
  ).slice(0, 4).map((b) => ({
    id: `branch-${b.id}`, label: b.name, description: b.code, icon: Building2, href: `/branches/${b.id}`, group: 'branch' as const,
  }))

  const allItems = [...filteredCreate, ...filtered, ...assetItems, ...branchItems]

  function go(href: string) { router.push(href); onOpenChange(false) }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, allItems.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)) }
      if (e.key === 'Enter' && allItems[activeIndex]) { go(allItems[activeIndex].href) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, allItems, activeIndex])

  const groups: { label: string; key: string; items: CommandItem[] }[] = [
    { label: 'Quick Actions', key: 'create', items: filteredCreate },
    { label: 'Navigate', key: 'navigate', items: filtered },
    { label: 'Assets', key: 'asset', items: assetItems },
    { label: 'Branches', key: 'branch', items: branchItems },
  ].filter((g) => g.items.length > 0)

  let itemCounter = 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-xl overflow-hidden shadow-modal">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
            placeholder="Search assets, branches, or jump to..."
            className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px] text-slate-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-[420px] overflow-y-auto py-2">
          {allItems.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-slate-400">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}
          {groups.map((group) => (
            <div key={group.key}>
              <p className="px-4 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{group.label}</p>
              {group.items.map((item) => {
                const idx = itemCounter++
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item.href)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      activeIndex === idx ? 'bg-brand-50' : 'hover:bg-slate-50'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', activeIndex === idx ? 'bg-brand-100' : 'bg-slate-100')}>
                      <item.icon className={cn('w-4 h-4', activeIndex === idx ? 'text-brand-600' : 'text-slate-500')} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm font-medium', activeIndex === idx ? 'text-brand-900' : 'text-slate-900')}>{item.label}</p>
                      {item.description && <p className="text-xs text-slate-400 truncate">{item.description}</p>}
                    </div>
                    <ArrowRight className={cn('w-3.5 h-3.5 flex-shrink-0', activeIndex === idx ? 'text-brand-400' : 'text-slate-200')} />
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center gap-4">
          {[['↑↓', 'Navigate'], ['↵', 'Select'], ['Esc', 'Close']].map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <kbd className="inline-flex h-5 items-center rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] text-slate-500">{key}</kbd>
              <span className="text-[11px] text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
