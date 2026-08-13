'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, X, Loader2, ShieldCheck, Clock3 } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { approvalsApi } from '@/lib/api/approvals'
import { approvalsKeys, usePendingApprovals } from '@/lib/hooks/useAdmin'
import { getApiErrorMessage } from '@/lib/api/errors'

export default function ApprovalsPage() {
    const qc = useQueryClient()
    const { data: approvals = [], isLoading, isError } = usePendingApprovals()
    const [decisioningId, setDecisioningId] = useState<string | null>(null)
    const [typeFilter, setTypeFilter] = useState<'all' | 'disposal' | 'transfer'>('all')
    const [note, setNote] = useState('')

    const pending = useMemo(
        () => approvals.filter((approval) => {
            if (approval.status !== 'pending') return false
            const kind = approval.requestType ?? approval.type
            return typeFilter === 'all' || kind === typeFilter
        }),
        [approvals, typeFilter],
    )

    async function handleDecision(approval: { id: string; requestType?: string; type?: string }, decision: 'approved' | 'rejected') {
        setDecisioningId(approval.id)
        const kind = approval.requestType ?? approval.type
        const body = {
            approved: decision === 'approved',
            decision,
            notes: note.trim() || (decision === 'approved' ? 'Approved via dashboard' : 'Rejected via dashboard'),
            decisionReason: note.trim() || (decision === 'approved' ? 'Approved via dashboard' : 'Rejected via dashboard'),
        }
        try {
            if (kind === 'transfer') {
                await approvalsApi.decideTransfer(approval.id, body)
            } else {
                await approvalsApi.decideDisposal(approval.id, body)
            }
            await qc.invalidateQueries({ queryKey: approvalsKeys.all })
            setNote('')
            toast.success(`Approval ${decision === 'approved' ? 'approved' : 'rejected'}`)
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Unable to update approval'))
        } finally {
            setDecisioningId(null)
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <PageHeader title="Approvals" description="Review pending disposal and transfer requests" />
                <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading pending approvals…</div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="space-y-4">
                <PageHeader title="Approvals" description="Review pending disposal and transfer requests" />
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">Unable to load approvals right now.</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Approvals" description="Segregation of duties for high-value disposals and transfers" />

            <div className="flex flex-wrap items-center gap-2">
                {(['all', 'disposal', 'transfer'] as const).map((item) => (
                    <button
                        key={item}
                        type="button"
                        onClick={() => setTypeFilter(item)}
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${typeFilter === item ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                        {item}
                    </button>
                ))}
                <span className="text-xs text-slate-500">{pending.length} in queue</span>
            </div>

            <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Decision note (optional, stored on the approval record)"
            />

            {pending.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                        <ShieldCheck className="h-5 w-5 text-slate-500" />
                    </div>
                    <p>No pending approvals.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {pending.map((approval) => (
                        <div key={approval.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-slate-900">{approval.assetName ?? approval.assetTag ?? 'Asset request'}</p>
                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                            {approval.requestType ?? approval.type ?? 'request'}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Requested by {approval.requestedByName ?? 'a team member'} on {new Date(approval.requestedAt).toLocaleString()}
                                    </p>
                                    {approval.payload?.reason ? <p className="mt-2 text-sm text-slate-500">Reason: {String(approval.payload.reason)}</p> : null}
                                    {approval.payload?.proceeds != null ? <p className="text-sm text-slate-500">Proceeds: {String(approval.payload.proceeds)}</p> : null}
                                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                                        <Clock3 className="h-3.5 w-3.5" />
                                        SLA clock starts at request time. Decide before month-end close.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-red-200 text-red-700 hover:bg-red-50"
                                        onClick={() => handleDecision(approval, 'rejected')}
                                        disabled={decisioningId === approval.id}
                                    >
                                        {decisioningId === approval.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                                        Reject
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => handleDecision(approval, 'approved')}
                                        disabled={decisioningId === approval.id}
                                    >
                                        {decisioningId === approval.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                        Approve
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
