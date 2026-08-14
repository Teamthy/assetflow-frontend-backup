'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Loader2, QrCode, Search } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { assetApi } from '@/lib/api/assets'
import { getApiErrorMessage } from '@/lib/api/errors'
import { extractAssetId } from '@/lib/utils/qr'

export default function ScanAssetPage() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [lookingUp, setLookingUp] = useState(false)

  async function lookup(raw: string) {
    const input = raw.trim()
    if (!input) {
      toast.error('Paste an asset ID, tag, or QR URL')
      return
    }

    setLookingUp(true)
    try {
      const assetId = extractAssetId(input)
      if (assetId) {
        const scanned = await assetApi.scan(assetId)
        router.push('/assets/' + scanned.id)
        return
      }

      const list = await assetApi.list({ search: input, limit: 5 })
      const matches = list.data ?? list.items ?? []
      const exact = matches.find((asset) => asset.assetTag.toLowerCase() === input.toLowerCase())
      const match = exact ?? (matches.length === 1 ? matches[0] : undefined)
      if (!match) {
        toast.error(matches.length > 1 ? 'Several assets match that search. Open the register and filter instead.' : 'No asset matched that ID or tag')
        return
      }
      router.push('/assets/' + match.id)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Asset not found'))
    } finally {
      setLookingUp(false)
    }
  }

  async function scanWithCamera() {
    const Detector = (window as Window & {
      BarcodeDetector?: new (options: { formats: string[] }) => {
        detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>
      }
    }).BarcodeDetector

    if (!Detector) {
      toast.error('This browser cannot read QR codes from the camera. Paste the asset tag or URL instead.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      const video = document.createElement('video')
      video.srcObject = stream
      await video.play()
      const detector = new Detector({ formats: ['qr_code'] })
      const started = Date.now()

      const tick = async () => {
        if (Date.now() - started > 15000) {
          stream.getTracks().forEach((track) => track.stop())
          toast.error('No QR code found. Paste the asset tag instead.')
          return
        }
        const codes = await detector.detect(video).catch(() => [])
        const raw = codes[0]?.rawValue
        if (raw) {
          stream.getTracks().forEach((track) => track.stop())
          setValue(raw)
          await lookup(raw)
          return
        }
        requestAnimationFrame(() => { void tick() })
      }

      await tick()
    } catch {
      toast.error('Camera access was blocked. Paste the QR URL or asset tag instead.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Scan asset"
        description="Look up an asset from a printed QR label, asset tag, or URL"
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Find by QR, tag, or ID</h2>
            <p className="text-sm text-slate-500 mt-1">
              Printed AssetFlow labels open this workspace. If the camera is not available, paste the code instead.
            </p>
          </div>
        </div>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            void lookup(value)
          }}
        >
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Paste asset tag, UUID, or https://…/assets/…"
            autoFocus
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={lookingUp} className="bg-blue-600 hover:bg-blue-700 text-white">
              {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Look up asset
            </Button>
            <Button type="button" variant="outline" onClick={() => void scanWithCamera()} disabled={lookingUp}>
              <Camera className="w-4 h-4" />
              Use camera
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
