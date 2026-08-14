'use client'

import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/lib/api/reports'
import { approvalsApi } from '@/lib/api/approvals'
import { auditApi } from '@/lib/api/audit'
import { asNumber, asRecord } from '@/lib/reports/helpers'

export const reportKeys = {
  all: ['reports'] as const,
  assets: () => [...reportKeys.all, 'assets'] as const,
  finance: () => [...reportKeys.all, 'finance'] as const,
  maintenance: () => [...reportKeys.all, 'maintenance'] as const,
  audit: () => [...reportKeys.all, 'audit'] as const,
}

export function useAssetReport() {
  return useQuery({ queryKey: reportKeys.assets(), queryFn: reportsApi.assets })
}

export function useFinanceReport() {
  return useQuery({ queryKey: reportKeys.finance(), queryFn: reportsApi.finance })
}

export function useMaintenanceReport() {
  return useQuery({ queryKey: reportKeys.maintenance(), queryFn: reportsApi.maintenance })
}

export function useAuditReport() {
  return useQuery({ queryKey: reportKeys.audit(), queryFn: reportsApi.audit })
}

export function useReportsSnapshot() {
  const assets = useAssetReport()
  const finance = useFinanceReport()
  const maintenance = useMaintenanceReport()
  const audit = useAuditReport()
  const approvals = useQuery({
    queryKey: ['approvals', 'pending'],
    queryFn: approvalsApi.listPending,
  })
  const campaigns = useQuery({
    queryKey: ['audit-campaigns'],
    queryFn: auditApi.listCampaigns,
  })

  const assetSummary = asRecord(asRecord(assets.data).summary)
  const financeData = asRecord(finance.data)
  const treatment = asRecord(financeData.accountingTreatment)
  const capitalized = asRecord(treatment.capitalized)
  const depreciation = asRecord(financeData.depreciation)
  const disposals = asRecord(financeData.disposals)
  const maintSummary = asRecord(asRecord(maintenance.data).summary)
  const auditData = asRecord(audit.data)
  const completeness = asRecord(auditData.fieldCompleteness)
  const pendingApprovals = (approvals.data ?? []).filter((item) => item.status === 'pending')
  const campaignRows = campaigns.data ?? []
  const expected = campaignRows.reduce((sum, row) => sum + asNumber(row.totalAssetsExpected), 0)
  const missing = campaignRows.reduce((sum, row) => sum + asNumber(row.totalMissing), 0)

  return {
    isLoading: assets.isLoading || finance.isLoading || maintenance.isLoading || audit.isLoading,
    isError: assets.isError || finance.isError || maintenance.isError || audit.isError,
    assets: {
      total: asNumber(assetSummary.total),
      active: asNumber(assetSummary.active),
      maintenance: asNumber(assetSummary.maintenance),
      disposed: asNumber(assetSummary.disposed),
      totalActiveValue: asNumber(assetSummary.totalActiveValue),
      byCategory: Array.isArray(asRecord(assets.data).byCategory)
        ? (asRecord(assets.data).byCategory as Array<Record<string, unknown>>)
        : [],
      byStatus: Array.isArray(asRecord(assets.data).byStatus)
        ? (asRecord(assets.data).byStatus as Array<Record<string, unknown>>)
        : [],
    },
    finance: {
      capitalizedCount: asNumber(capitalized.count),
      capitalizedValue: asNumber(capitalized.totalValue),
      disposalProceeds: asNumber(disposals.totalProceeds),
      accumulated: asNumber(depreciation.totalAccumulated),
      yearCharge: asNumber(depreciation.currentYearCharge),
      coveragePercent: asNumber(depreciation.coveragePercent),
      depreciable: asNumber(depreciation.totalDepreciableAssets),
      treatment,
      disposalsByMethod: Array.isArray(disposals.byMethod)
        ? (disposals.byMethod as Array<Record<string, unknown>>)
        : [],
    },
    maintenance: {
      total: asNumber(maintSummary.total),
      open: asNumber(maintSummary.open) + asNumber(maintSummary.inProgress),
      completed: asNumber(maintSummary.completed),
      overdue: asNumber(maintSummary.overdue),
      dueSoon: asNumber(maintSummary.dueSoon),
      byPriority: Array.isArray(asRecord(maintenance.data).byPriority)
        ? (asRecord(maintenance.data).byPriority as Array<Record<string, unknown>>)
        : [],
      byStatus: Array.isArray(asRecord(maintenance.data).byStatus)
        ? (asRecord(maintenance.data).byStatus as Array<Record<string, unknown>>)
        : [],
    },
    audit: {
      totalAssets: asNumber(completeness.totalAssets),
      missingSerialNumber: asNumber(completeness.missingSerialNumber),
      missingPurchaseDate: asNumber(completeness.missingPurchaseDate),
      missingCategory: asNumber(completeness.missingCategory),
      missingBranch: asNumber(completeness.missingBranch),
      pendingReview: asNumber(completeness.pendingReview),
      completenessPercent: asNumber(completeness.completenessPercent),
      recognition: Array.isArray(auditData.recognitionSummary)
        ? (auditData.recognitionSummary as Array<Record<string, unknown>>)
        : [],
    },
    approvals: {
      pending: pendingApprovals.length,
      total: (approvals.data ?? []).length,
    },
    campaigns: {
      count: campaignRows.length,
      expected,
      missing,
      exceptionRate: expected > 0 ? Math.round((missing / expected) * 100) : 0,
    },
  }
}
