'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, X, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { approvalsApi } from '@/lib/api/approvals'
import { approvalsKeys, usePendingApprovals } from '@/lib/hooks/useAdmin'

export default function ApprovalsPage() {
    const qc = useQueryClient()
    const { data: approvals = [], isLoading, isError } = usePendingApprovals()
    const [decisioningId, setDecisioningId] = useState<string | null>(null)

    const pending = useMemo(() => approvals.filter((approval) => approval.status === 'pending'), [approvals])

    async function handleDecision(approvalId: string, decision: 'approved' | 'rejected') {
        setDecisioningId(approvalId)
        try {
            await approvalsApi.decideDisposal(approvalId, {
                decision,
                decisionReason: decision === 'approved' ? 'Approved via dashboard' : 'Rejected via dashboard',
            })
            await qc.invalidateQueries({ queryKey: approvalsKeys.all })
            toast.success(`Approval ${decision === 'approved' ? 'approved' : 'rejected'}`)
        } catch {
            toast.error('Unable to update approval')
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
            <PageHeader title="Approvals" description="Review pending disposal and transfer requests" />

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
                                            {approval.requestType}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Requested by {approval.requestedByName ?? 'a team member'} on {new Date(approval.requestedAt).toLocaleString()}
                                    </p>
                                    {approval.payload?.reason ? <p className="mt-2 text-sm text-slate-500">Reason: {String(approval.payload.reason)}</p> : null}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-red-200 text-red-700 hover:bg-red-50"
                                        onClick={() => handleDecision(approval.id, 'rejected')}
                                        disabled={decisioningId === approval.id}
                                    >
                                        {decisioningId === approval.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                                        Reject
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => handleDecision(approval.id, 'approved')}
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
