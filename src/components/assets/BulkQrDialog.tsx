'use client'

import { useEffect, useState } from 'react'
import { Download, Loader2, Printer, QrCode } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { assetApi } from '@/lib/api/assets'
import { getApiErrorMessage } from '@/lib/api/errors'
import { downloadDataUrl, printQrSheet } from '@/lib/utils/qr'
import type { Asset, AssetQrCode } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  assets: Asset[]
}

export function BulkQrDialog({ open, onOpenChange, assets }: Props) {
  const [codes, setCodes] = useState<AssetQrCode[]>([])
  const [failed, setFailed] = useState<Array<{ assetId: string; reason: string }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || assets.length === 0) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setCodes([])
      setFailed([])
      try {
        const result = await assetApi.bulkQr(assets.map((asset) => asset.id))
        if (cancelled) return
        setCodes(result.successful ?? [])
        setFailed(result.failed ?? [])
      } catch (error) {
        if (!cancelled) toast.error(getApiErrorMessage(error, 'Unable to generate QR codes'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [open, assets])

  function handlePrint() {
    if (codes.length === 0) return
    const byId = new Map(assets.map((asset) => [asset.id, asset]))
    printQrSheet(codes.map((code) => ({
      name: byId.get(code.assetId)?.name,
      assetTag: code.assetTag,
      qrCodeDataUrl: code.qrCodeDataUrl,
      qrCodeUrl: code.qrCodeUrl,
    })))
  }

  function handleDownloadAll() {
    codes.forEach((code) => downloadDataUrl(code.qrCodeDataUrl, `${code.assetTag}-qr.png`))
    toast.success(`${codes.length} QR codes downloaded`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>QR labels</DialogTitle>
              <DialogDescription>
                Generate printable labels for {assets.length} selected asset{assets.length === 1 ? '' : 's'}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating QR codes...
            </div>
          ) : (
            <>
              {failed.length > 0 && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {failed.length} label{failed.length === 1 ? '' : 's'} failed. {failed[0]?.reason}
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {codes.map((code) => {
                  const asset = assets.find((item) => item.id === code.assetId)
                  return (
                    <div key={code.assetId} className="rounded-xl border border-slate-200 p-3 text-center">
                      <img src={code.qrCodeDataUrl} alt={code.assetTag} className="mx-auto h-28 w-28" />
                      <div className="mt-2 truncate text-sm font-semibold text-slate-900">{asset?.name ?? code.assetTag}</div>
                      <div className="font-mono text-xs text-slate-500">{code.assetTag}</div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button type="button" variant="outline" onClick={handleDownloadAll} disabled={loading || codes.length === 0}>
            <Download className="h-4 w-4" />
            Download PNGs
          </Button>
          <Button type="button" className="bg-blue-600 text-white hover:bg-blue-700" onClick={handlePrint} disabled={loading || codes.length === 0}>
            <Printer className="h-4 w-4" />
            Print labels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
