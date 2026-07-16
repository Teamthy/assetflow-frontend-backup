'use client'

import { Loader2, AlertTriangle } from 'lucide-react'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
} from '@/components/ui/alert-dialog'

export interface ConfirmDialogProps {
  open: boolean
  onClose?: () => void
  onOpenChange?: (open: boolean) => void
  onConfirm: () => void
  isLoading?: boolean
  title: string
  description: string
  confirmLabel?: string
  variant?: 'danger' | 'warning' | 'default' | 'destructive'
}

const variantConfig = {
  danger:      { btn: 'bg-red-600 hover:bg-red-700 text-white',    icon: 'text-red-500',    bg: 'bg-red-50' },
  destructive: { btn: 'bg-red-600 hover:bg-red-700 text-white',    icon: 'text-red-500',    bg: 'bg-red-50' },
  warning:     { btn: 'bg-amber-600 hover:bg-amber-700 text-white', icon: 'text-amber-500',  bg: 'bg-amber-50' },
  default:     { btn: 'bg-brand-600 hover:bg-brand-700 text-white', icon: 'text-brand-500',  bg: 'bg-brand-50' },
}

export function ConfirmDialog({
  open, onClose, onOpenChange, onConfirm, isLoading = false,
  title, description, confirmLabel = 'Confirm', variant = 'danger',
}: ConfirmDialogProps) {
  const handleOpenChange = (v: boolean) => {
    if (!v) { onClose?.(); onOpenChange?.(false) }
    else { onOpenChange?.(true) }
  }
  const vc = variantConfig[variant] ?? variantConfig.danger

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-sm p-0 overflow-hidden">
        <AlertDialogHeader className="px-6 pt-6 pb-4">
          <div className={`w-10 h-10 ${vc.bg} rounded-xl flex items-center justify-center mb-3`}>
            <AlertTriangle className={`w-5 h-5 ${vc.icon}`} />
          </div>
          <AlertDialogTitle className="text-base font-semibold text-slate-900">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-slate-500 mt-1">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
          <button onClick={() => handleOpenChange(false)} disabled={isLoading} className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg border border-slate-200 transition-all disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isLoading} className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 ${vc.btn}`}>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
