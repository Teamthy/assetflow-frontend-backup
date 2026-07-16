'use client'

import Link from 'next/link'
import { ShieldOff, Home, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth'

const roleLabels: Record<string, string> = {
  primary_admin: 'Primary Admin',
  org_admin: 'Organization Admin',
  asset_manager: 'Asset Manager',
  finance_user: 'Finance User',
  branch_manager: 'Branch Manager',
  maintenance_staff: 'Maintenance Staff',
  auditor: 'Auditor',
  standard_staff: 'Standard Staff',
}

export default function UnauthorizedPage() {
  const role = useAuthStore((s) => s.role)
  const roleLabel = role ? roleLabels[role] ?? role : 'Member'

  return (
    <div className="max-w-md mx-auto py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-6">
        <ShieldOff className="w-8 h-8 text-amber-600" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Access restricted</h1>
      <p className="text-sm text-slate-500 mt-2 leading-relaxed">
        You do not have permission to view this page. Contact your administrator if you need access.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-left">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Your role</div>
        <div className="text-sm font-semibold text-slate-900">{roleLabel}</div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2">
        <a href="mailto:admin@yourcompany.com">
          <Button variant="outline">
            <Mail className="w-4 h-4" />
            Contact admin
          </Button>
        </a>
        <Link href="/dashboard">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Home className="w-4 h-4" />
            Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
