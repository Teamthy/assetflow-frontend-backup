'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, LogOut, User, Settings, ChevronDown, Menu,
} from 'lucide-react'

import { useAuthStore } from '@/lib/stores/auth'
import { useUIStore } from '@/lib/stores/ui'
import { authApi } from '@/lib/api/auth'
import { getInitials } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { NotificationDrawer } from '@/components/notifications/NotificationDrawer'
import { CommandPalette } from '@/components/shared/CommandPalette'

export function Topbar() {
  const router = useRouter()
  const { sidebarCollapsed, setMobileOpen } = useUIStore()
  const { user, organization, logout } = useAuthStore()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [cmdkOpen, setCmdkOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdkOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await authApi.logout()
    } catch {
      // Continue logout even if API fails
    } finally {
      logout()
      router.push('/login')
    }
  }

  const userName = user?.fullName ?? user?.email ?? 'User'
  const userEmail = user?.email ?? ''
  const initials = getInitials(userName)

  return (
    <>
      <header
        className={cn(
          'fixed top-0 right-0 left-0 z-30 h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 transition-all duration-200',
          sidebarCollapsed ? 'lg:left-16' : 'lg:left-60'
        )}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCmdkOpen(true)}
            className="hidden sm:flex items-center gap-2.5 h-9 px-3.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-sm hover:border-slate-300 hover:bg-white transition-all duration-150 min-w-[200px] lg:min-w-[240px]"
          >
            <Search className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1 text-left">Search or jump to...</span>
            <kbd className="hidden lg:inline-flex h-5 items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] text-slate-400">
              &#8984;K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <NotificationDrawer />
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-50 transition-all duration-150 outline-none">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="text-xs font-semibold bg-blue-100 text-blue-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate max-w-[120px]">
                    {userName}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
              <DropdownMenuLabel className="pb-2">
                <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
                <p className="text-xs text-slate-500 font-normal truncate mt-0.5">{userEmail}</p>
                {organization?.name && (
                  <p className="text-xs text-slate-400 font-normal truncate mt-0.5">
                    {organization.name}
                  </p>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="w-4 h-4 mr-2 text-slate-400" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2 text-slate-400" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isSigningOut ? 'Signing out...' : 'Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandPalette open={cmdkOpen} onOpenChange={setCmdkOpen} />
    </>
  )
}
