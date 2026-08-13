'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Download, Upload, FileSpreadsheet, CheckCircle2,
  AlertCircle, XCircle, Loader2, ArrowRight, RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { useImportAssets } from '@/lib/hooks/useAssets'
import { formatFileSize } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

type Step = 'template' | 'upload' | 'preview' | 'confirm' | 'results'

interface ImportResult {
  inserted?: number
  failed?: number
  successCount?: number
  failedCount?: number
  errors?: Array<{ row?: number; message?: string; error?: string }>
  failures?: Array<{ row?: number; message?: string; error?: string }>
  recognitionSummary?: Record<string, number>
}

const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export default function ImportAssetsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const importMutation = useImportAssets()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('template')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const isOnboardingFlow = searchParams.get('from') === 'onboarding'

  function validateFile(f: File): boolean {
    setFileError('')
    const isSpreadsheet =
      f.name.endsWith('.xlsx') ||
      f.name.endsWith('.xls') ||
      f.name.endsWith('.csv') ||
      f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      f.type === 'application/vnd.ms-excel' ||
      f.type === 'text/csv'

    if (!isSpreadsheet) {
      setFileError('Only .xlsx, .xls, or .csv files are supported')
      return false
    }

    if (f.size > MAX_FILE_SIZE_BYTES) {
      setFileError('File is too large. Maximum size is ' + MAX_FILE_SIZE_MB + 'MB')
      return false
    }

    return true
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!validateFile(selected)) return
    setFile(selected)
    setStep('preview')
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragActive(false)
    const dropped = e.dataTransfer.files?.[0]
    if (!dropped) return
    if (!validateFile(dropped)) return
    setFile(dropped)
    setStep('preview')
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragActive(true)
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragActive(false)
  }

  async function handleImport() {
    if (!file) return

    setStep('confirm')

    try {
      const response = await importMutation.mutateAsync(file) as unknown

      let normalized: ImportResult = {}
      if (response && typeof response === 'object') {
        const r = response as Record<string, unknown>
        const data = (r.data as ImportResult) ?? (r as ImportResult)
        normalized = {
          inserted: (data.inserted as number) ?? (data.successCount as number) ?? 0,
          failed: (data.failed as number) ?? (data.failedCount as number) ?? 0,
          errors: (data.errors as ImportResult['errors']) ?? (data.failures as ImportResult['errors']) ?? [],
          recognitionSummary: data.recognitionSummary as Record<string, number> | undefined,
        }
      }

      setResult(normalized)
      setStep('results')
      toast.success((normalized.inserted ?? 0) + ' assets imported')
    } catch {
      // toast in hook
      setStep('preview')
    }
  }

  function resetWizard() {
    setStep('template')
    setFile(null)
    setResult(null)
    setFileError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function downloadTemplate() {
    // Generate a CSV template client-side with corrected schema
    const headers = [
      'name',
      'assetTag',
      'serialNumber',
      'purchaseCost',
      'purchaseDate',
      'status',
      'condition',
      'expectedUsefulLifeMonths',
      'residualValue',
      'branchId',
      'assignedTo',
      'hasFutureEconomicBenefit',
      'costCanBeReliablyMeasured',
    ]
    const example = [
      'Dell Latitude 5540',
      'AST-00001',
      'DL5540-2024-001',
      '450000',
      '2024-03-15',
      'active',
      'good',
      '48',
      '50000',
      '',
      '',
      'true',
      'true',
    ]
    const csv = headers.join(',') + '\n' + example.join(',') + '\n'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'assetflow-import-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Template downloaded')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/assets" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to assets
      </Link>

      <PageHeader
        title="Import your asset register"
        description="Bulk import your existing asset register from Excel or CSV"
      />

      {isOnboardingFlow && (
        <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-900">Excel-first setup is the fastest way to get started</h3>
              <p className="text-sm text-blue-800 mt-1">
                Download the template, add your register, and review the imported rows before you finish.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress steps */}
      <div className="flex items-center justify-center mb-8">
        <StepIndicator label="Template" active={step === 'template'} completed={step !== 'template'} number={1} />
        <StepConnector completed={step !== 'template'} />
        <StepIndicator label="Upload" active={step === 'upload'} completed={step === 'preview' || step === 'confirm' || step === 'results'} number={2} />
        <StepConnector completed={step === 'preview' || step === 'confirm' || step === 'results'} />
        <StepIndicator label="Preview" active={step === 'preview'} completed={step === 'confirm' || step === 'results'} number={3} />
        <StepConnector completed={step === 'results'} />
        <StepIndicator label="Complete" active={step === 'results'} completed={step === 'results'} number={4} />
      </div>

      {step === 'template' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Download className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Download the template</h3>
            <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
              Use our template to make sure your columns match. It includes example rows and all supported fields.
            </p>

            <div className="mt-6 flex gap-2 justify-center">
              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Download className="w-4 h-4" />
                Download template
              </Button>
              <Button
                onClick={() => setStep('upload')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 text-left">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Required columns</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <ColumnHint name="name" required />
                <ColumnHint name="assetTag" required />
                <ColumnHint name="serialNumber" />
                <ColumnHint name="purchaseCost" />
                <ColumnHint name="purchaseDate" />
                <ColumnHint name="status" />
                <ColumnHint name="condition" />
                <ColumnHint name="expectedUsefulLifeMonths" />
                <ColumnHint name="residualValue" />
                <ColumnHint name="branchId" />
                <ColumnHint name="assignedTo" />
              </div>
              <p className="text-xs text-slate-500 mt-3">
                💡 Leave <span className="font-mono">branchId</span> and <span className="font-mono">assignedTo</span> empty if you don't have UUIDs yet — they'll be assigned later.
              </p>
            </div>
          </div>
        </div>
      )}

      {step === 'upload' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <div className="max-w-xl mx-auto">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-150',
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4',
                dragActive ? 'bg-blue-100' : 'bg-white'
              )}>
                <Upload className={cn('w-7 h-7', dragActive ? 'text-blue-600' : 'text-slate-400')} />
              </div>
              <p className="text-base font-semibold text-slate-900">
                {dragActive ? 'Drop your file here' : 'Drop file here or click to browse'}
              </p>
              <p className="text-sm text-slate-500 mt-1.5">
                .xlsx or .xls, up to {MAX_FILE_SIZE_MB}MB
              </p>
            </div>

            {fileError && (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{fileError}</p>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep('template')}>
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="w-4 h-4" />
                Download template
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'preview' && file && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={() => { setFile(null); setStep('upload') }}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">Ready to import</p>
                  <p className="text-sm text-blue-800 mt-1 leading-relaxed">
                    Your file will be validated on the server. Rows with errors will be skipped and reported.
                    Valid rows will be created and assigned to your organization.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep('upload')}>
                <ArrowLeft className="w-4 h-4" />
                Change file
              </Button>
              <Button
                onClick={handleImport}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={importMutation.isPending}
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Import assets
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Importing your assets</h3>
          <p className="text-sm text-slate-500 mt-1.5">This may take a moment for large files.</p>
        </div>
      )}

      {step === 'results' && result && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
            <div className="text-center">
              <div className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4',
                (result.inserted ?? 0) > 0 ? 'bg-emerald-50' : 'bg-amber-50'
              )}>
                {(result.inserted ?? 0) > 0 ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-7 h-7 text-amber-600" />
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900">Import complete</h3>
              <p className="text-sm text-slate-500 mt-1.5">
                {result.inserted ?? 0} assets imported successfully
                {(result.failed ?? 0) > 0 && ', ' + result.failed + ' failed'}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
                <div className="text-3xl font-bold text-emerald-700">{result.inserted ?? 0}</div>
                <div className="text-sm text-emerald-800 mt-1">Successful</div>
              </div>
              <div className={cn(
                'rounded-lg border p-4 text-center',
                (result.failed ?? 0) > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
              )}>
                <div className={cn(
                  'text-3xl font-bold',
                  (result.failed ?? 0) > 0 ? 'text-red-700' : 'text-slate-400'
                )}>{result.failed ?? 0}</div>
                <div className={cn(
                  'text-sm mt-1',
                  (result.failed ?? 0) > 0 ? 'text-red-800' : 'text-slate-500'
                )}>Failed</div>
              </div>
            </div>

            {result.recognitionSummary && Object.keys(result.recognitionSummary).length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Recognition summary</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(result.recognitionSummary).map(([key, count]) => (
                    <div key={key} className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
                      <div className="text-lg font-bold text-slate-900">{count}</div>
                      <div className="text-xs text-slate-500 mt-0.5 capitalize">{key.replace(/_/g, ' ')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-red-100 bg-red-50">
                <h4 className="text-sm font-semibold text-red-900">
                  Failed rows ({result.errors.length})
                </h4>
                <p className="text-xs text-red-700 mt-0.5">Fix these issues and re-import</p>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {result.errors.map((err, i) => (
                  <div key={i} className="px-6 py-3 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                      {err.row ?? i + 1}
                    </div>
                    <p className="text-sm text-slate-700">{err.message ?? err.error ?? 'Unknown error'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={resetWizard}>
              <RotateCcw className="w-4 h-4" />
              Import another file
            </Button>
            <Button
              onClick={() => router.push('/assets')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              View imported assets
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function StepIndicator({ label, active, completed, number }: { label: string; active: boolean; completed: boolean; number: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200',
        active ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
          completed ? 'bg-emerald-500 text-white' :
            'bg-slate-100 text-slate-400'
      )}>
        {completed && !active ? <CheckCircle2 className="w-5 h-5" /> : number}
      </div>
      <span className={cn(
        'text-xs font-medium mt-2',
        active ? 'text-slate-900' : completed ? 'text-slate-700' : 'text-slate-400'
      )}>
        {label}
      </span>
    </div>
  )
}

function StepConnector({ completed }: { completed: boolean }) {
  return (
    <div className={cn(
      'h-0.5 w-16 sm:w-24 mx-2 mt-[-18px] transition-all duration-200',
      completed ? 'bg-emerald-500' : 'bg-slate-200'
    )} />
  )
}

function ColumnHint({ name, required }: { name: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700">{name}</code>
      {required && <span className="text-xs text-red-500 font-medium">required</span>}
    </div>
  )
}
