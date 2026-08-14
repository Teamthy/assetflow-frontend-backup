'use client'

import { useQuery } from '@tanstack/react-query'
import { Download, Loader2, Printer, QrCode, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { assetApi } from '@/lib/api/assets'
import { getApiErrorMessage } from '@/lib/api/errors'
import { downloadDataUrl, printQrSheet } from '@/lib/utils/qr'
import type { Asset } from '@/types'

export function AssetQrCard({ asset }: { asset: Asset }) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['assets', asset.id, 'qr'],
    queryFn: () => assetApi.qr(asset.id),
  })

  function handleDownload() {
    if (!data?.qrCodeDataUrl) return
    downloadDataUrl(data.qrCodeDataUrl, `${data.assetTag || asset.assetTag}-qr.png`)
    toast.success('QR code downloaded')
  }

  function handlePrint() {
    if (!data?.qrCodeDataUrl) return
    printQrSheet([{
      name: asset.name,
      assetTag: data.assetTag || asset.assetTag,
      qrCodeDataUrl: data.qrCodeDataUrl,
      qrCodeUrl: data.qrCodeUrl,
    }])
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Asset QR code</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Scan this label to open {asset.assetTag} in AssetFlow.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </Button>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Generating QR code...
          </div>
        ) : error || !data?.qrCodeDataUrl ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {getApiErrorMessage(error, 'Unable to generate this QR code right now.')}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <img
                src={data.qrCodeDataUrl}
                alt={`QR code for ${asset.assetTag}`}
                className="h-44 w-44"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <QrCode className="w-4 h-4 text-slate-400" />
                {data.assetTag || asset.assetTag}
              </div>
              <p className="text-sm text-slate-600 break-all">{data.qrCodeUrl}</p>
              <p className="text-xs text-slate-500">
                Print this onto a label and stick it on the asset. Camera scans open the asset page.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="w-4 h-4" />
                  Download PNG
                </Button>
                <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Printer className="w-4 h-4" />
                  Print label
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
