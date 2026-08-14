'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, FileText, Filter, Loader2, Search, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { documentsApi, type DocumentRecord } from '@/lib/api/documents'
import { downloadBlob } from '@/lib/utils/download'
import { formatDateTime, formatFileSize } from '@/lib/utils/format'
import { getApiErrorMessage } from '@/lib/api/errors'

const CATEGORIES = [
  'invoice', 'warranty', 'photo', 'receipt', 'contract', 'manual',
  'maintenance_evidence', 'disposal_approval', 'audit_evidence', 'other',
]

export default function DocumentsPage() {
  const qc = useQueryClient()
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploadCategory, setUploadCategory] = useState('invoice')
  const [entityId, setEntityId] = useState('')

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['documents', category],
    queryFn: () => documentsApi.list(category === 'all' ? undefined : { category }),
  })

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Choose a file')
      if (!entityId.trim()) throw new Error('Asset ID is required')
      return documentsApi.upload({
        file,
        entityType: 'asset',
        entityId: entityId.trim(),
        category: uploadCategory,
      })
    },
    onSuccess: () => {
      toast.success('Document stored')
      setFile(null)
      setEntityId('')
      void qc.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Upload failed')),
  })

  const items = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return data
    return data.filter((doc) =>
      [doc.originalFileName, doc.fileName, doc.category, doc.entityId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [data, search])

  async function download(doc: DocumentRecord) {
    try {
      const blob = await documentsApi.download(doc.id)
      downloadBlob(blob, doc.originalFileName ?? doc.fileName ?? `${doc.id}.bin`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Download failed'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Invoices, warranties, photos, and other files attached to assets"
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Upload className="h-4 w-4" />
          Attach supporting document
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input placeholder="Asset UUID" value={entityId} onChange={(e) => setEntityId(e.target.value)} />
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
          >
            {CATEGORIES.map((item) => <option key={item} value={item}>{item.replace(/_/g, ' ')}</option>)}
          </select>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
          <Button onClick={() => upload.mutate()} disabled={upload.isPending}>
            {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload'}
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Use the asset ID from the asset page URL.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search file name or asset" className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm" />
        </div>
        <Filter className="h-4 w-4 text-slate-400" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-3 text-sm">
          <option value="all">All categories</option>
          {CATEGORIES.map((item) => <option key={item} value={item}>{item.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading documents…</p>
      ) : isError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Documents are not available yet. Try again shortly.
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          <FileText className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          No documents in this view.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{doc.originalFileName ?? doc.fileName ?? doc.id}</td>
                  <td className="px-4 py-3 capitalize text-slate-500">{(doc.category ?? 'file').replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{doc.entityId ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{doc.fileSize ? formatFileSize(doc.fileSize) : '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(doc.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => download(doc)}>
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
