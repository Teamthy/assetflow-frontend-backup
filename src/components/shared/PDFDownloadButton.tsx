'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { assetApi } from '@/lib/api/assets'

interface PDFDownloadButtonProps {
  reportType: 'asset-register' | 'depreciation' | 'disposal' | 'audit'
  params?: Record<string, string>
  label?: string
  className?: string
}

export function PDFDownloadButton({
  reportType,
  label = 'Download Excel',
  className,
}: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      const blob = await assetApi.export({})
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `assetflow-${reportType}-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Register exported')
    } catch {
      toast.error('Export failed')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={[
        'inline-flex items-center gap-2 px-4 py-2.5',
        'bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold',
        'rounded-xl border border-slate-200',
        'transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed',
        className ?? '',
      ].join(' ')}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          {label}
        </>
      )}
    </button>
  )
}
