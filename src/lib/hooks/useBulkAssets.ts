'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { bulkApi, type BulkResult } from '@/lib/api/bulk'
import { getApiErrorMessage } from '@/lib/api/errors'
import { assetKeys } from '@/lib/hooks/useAssets'
import { reportKeys } from '@/lib/hooks/useReports'

function summarize(action: string, result: BulkResult) {
  const ok = result.successful?.length ?? 0
  const pending = result.submittedForApproval?.length ?? 0
  const failed = result.failed?.length ?? 0
  const firstFail = result.failed?.[0]?.reason

  if (ok > 0 && failed === 0 && pending === 0) {
    toast.success(`${ok} asset${ok === 1 ? '' : 's'} ${action}`)
    return
  }
  if (pending > 0 && failed === 0) {
    toast.success(
      `${ok} disposed · ${pending} sent for approval${ok || pending ? '' : ''}`
        .replace(/^0 disposed · /, ''),
    )
    return
  }
  if (failed > 0 && ok + pending > 0) {
    toast.warning(
      `${ok + pending} ${action}, ${failed} failed${firstFail ? ` · ${firstFail}` : ''}`,
    )
    return
  }
  toast.error(firstFail || `Could not ${action} the selected assets`)
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
  queryClient.invalidateQueries({ queryKey: assetKeys.audit() })
  queryClient.invalidateQueries({ queryKey: reportKeys.all })
  queryClient.invalidateQueries({ queryKey: ['approvals'] })
}

export function useBulkTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bulkApi.transfer,
    onSuccess: (result) => {
      invalidate(queryClient)
      summarize('transferred', result)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Bulk transfer failed')),
  })
}

export function useBulkDispose() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bulkApi.dispose,
    onSuccess: (result) => {
      invalidate(queryClient)
      const ok = result.successful?.length ?? 0
      const pending = result.submittedForApproval?.length ?? 0
      const failed = result.failed?.length ?? 0
      const firstFail = result.failed?.[0]?.reason
      if (failed === 0) {
        const parts = [
          ok > 0 ? `${ok} disposed` : null,
          pending > 0 ? `${pending} sent for approval (≥ ₦500,000)` : null,
        ].filter(Boolean)
        toast.success(parts.join(' · ') || 'Disposal complete')
        return
      }
      if (ok + pending > 0) {
        toast.warning(`${ok + pending} processed, ${failed} failed${firstFail ? ` · ${firstFail}` : ''}`)
        return
      }
      toast.error(firstFail || 'Bulk disposal failed')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Bulk disposal failed')),
  })
}

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bulkApi.updateStatus,
    onSuccess: (result, variables) => {
      invalidate(queryClient)
      summarize(`marked ${variables.status}`, result)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Bulk status update failed')),
  })
}

export function useBulkDelete() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bulkApi.delete,
    onSuccess: (result) => {
      invalidate(queryClient)
      summarize('deleted', result)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Bulk delete failed')),
  })
}
