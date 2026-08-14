'use client'

import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { PageHeader } from '@/components/shared/PageHeader'
import { TransferAssetForm } from '@/components/assets/TransferAssetForm'
import { useAsset } from '@/lib/hooks/useAssets'

export default function TransferAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: asset, isLoading, error } = useAsset(id)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <PageHeader title="Transfer asset" description="Move this asset to another branch or assignee" />
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading asset…</div>
      </div>
    )
  }

  if (error || !asset) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <PageHeader title="Transfer asset" description="Move this asset to another branch or assignee" />
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
          We could not load this asset right now.
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/assets/${asset.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          Back to asset
        </Link>
      </div>

      <PageHeader title="Transfer asset" description={`Move ${asset.name} to another branch or assignee`} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <TransferAssetForm asset={asset} onSuccess={() => router.push(`/assets/${asset.id}`)} onCancel={() => router.push(`/assets/${asset.id}`)} />
      </div>
    </div>
  )
}
