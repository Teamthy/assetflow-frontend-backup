export type AssetStatus = 'active' | 'maintenance' | 'disposed'
export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor'
export type AccountingTreatment =
  | 'capitalized'
  | 'expensed'
  | 'tracked_non_capitalized'
  | 'pending_review'
export type RecognitionStatus = 'recognized' | 'not_recognized' | 'pending_review'
export type DepreciationMethod = 'straight_line' | 'reducing_balance'
export type DisposalMethod = 'sold' | 'donated' | 'scrapped' | 'lost' | 'written_off' | 'other'
export type DisposalStatus = 'pending_approval' | 'approved' | 'rejected' | 'auto_approved'
export type MaintenanceStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'critical'
export type UserRole =
  | 'primary_admin'
  | 'org_admin'
  | 'asset_manager'
  | 'finance_user'
  | 'branch_manager'
  | 'maintenance_staff'
  | 'auditor'
  | 'standard_staff'

export interface User {
  id: string
  firstName: string
  lastName: string
  fullName?: string
  email: string
  createdAt?: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  industry?: string
  logoUrl?: string
  rcNumber?: string
  address?: string
  isMultiBranch?: boolean
  capitalizationThreshold?: number
  disposalApprovalThreshold?: number
  minimumUsefulLifeMonths?: number
  fiscalYearEndMonth?: number
  defaultDepreciationMethod?: DepreciationMethod
}

export interface Branch {
  id: string
  name: string
  code?: string
  description?: string
  isActive: boolean
  assetCount?: number
  createdAt: string
  updatedAt?: string
}

export interface Asset {
  id: string
  name: string
  description?: string
  assetTag: string
  serialNumber?: string
  category?: string
  manufacturer?: string
  model?: string
  status: AssetStatus
  condition: AssetCondition
  purchaseCost?: number
  purchaseDate?: string
  warrantyExpiryDate?: string
  expectedUsefulLifeMonths?: number
  residualValue?: number
  recognitionStatus: RecognitionStatus
  accountingTreatment: AccountingTreatment
  hasFutureEconomicBenefit?: boolean
  costCanBeReliablyMeasured?: boolean
  isDepreciable: boolean
  recognitionReasons?: string[]
  qrCodeUrl?: string
  branch?: Branch
  branchId?: string
  assignedUser?: User
  assignedTo?: string
  isDeleted: boolean
  deletedAt?: string
  createdAt: string
  updatedAt: string
  disposalStatus?: DisposalStatus
}

export interface MaintenanceTask {
  id: string
  title: string
  description?: string
  status: MaintenanceStatus
  priority: MaintenancePriority
  dueDate?: string
  dueAt?: string
  completionNote?: string
  completedAt?: string
  startedAt?: string
  asset: Pick<Asset, 'id' | 'name' | 'assetTag'>
  assignedUser?: User
  createdBy: User
  createdAt: string
}

export interface DepreciationSnapshot {
  id: string
  fiscalYear: number
  method: DepreciationMethod
  periodUsedPriorYears: number
  periodUsedCurrentYear: number
  accumulatedDepreciationBF: number
  yearlyDepreciationCharge: number
  totalAccumulatedDepreciation: number
  runDate: string
  createdAt: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  redirectUrl?: string
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  items?: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface CreateAssetDto {
  name: string
  assetTag: string
  status: AssetStatus
  condition: AssetCondition
  description?: string
  serialNumber?: string
  category?: string
  manufacturer?: string
  model?: string
  branchId?: string
  assignedTo?: string
  purchaseCost?: number
  purchaseDate?: string
  warrantyExpiryDate?: string
  expectedUsefulLifeMonths?: number
  residualValue?: number
  isDepreciable?: boolean
  hasFutureEconomicBenefit?: boolean
  costCanBeReliablyMeasured?: boolean
}

export interface RestoreAssetDto {
  reason?: string
  targetStatus?: AssetStatus
}

export interface TransferAssetDto {
  branchId?: string
  toBranchId?: string
  toUserId?: string
  reason?: string
}

export interface DisposeAssetDto {
  method?: string
  reason?: string
  proceeds?: number
  disposedAt?: string
  approvedByUserId?: string
  notes?: string
}

export interface RecordDepreciationDto {
  fiscalYear?: number
  depreciationMethod?: DepreciationMethod
  periodUsedPriorYears?: number
  periodUsedCurrentYear?: number
  accumulatedDepreciationBf?: number
  yearlyDepCharge?: number
  totalAccumulatedDepreciation?: number
  runDate?: string
}

export interface UpdateAssetDto {
  name?: string
  assetTag?: string
  status?: AssetStatus
  condition?: AssetCondition
  description?: string | null
  serialNumber?: string | null
  category?: string | null
  manufacturer?: string | null
  model?: string | null
  branchId?: string | null
  assignedTo?: string | null
  purchaseCost?: number | null
  purchaseDate?: string | null
  warrantyExpiryDate?: string | null
  expectedUsefulLifeMonths?: number | null
  residualValue?: number | null
  isDepreciable?: boolean
  hasFutureEconomicBenefit?: boolean
  costCanBeReliablyMeasured?: boolean
}

export interface AssetListParams {
  page?: number
  limit?: number
  search?: string
  status?: AssetStatus | AssetStatus[]
  condition?: AssetCondition | AssetCondition[]
  branchId?: string
  assigneeId?: string
  accountingTreatment?: AccountingTreatment
  purchaseDateFrom?: string
  purchaseDateTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  includeDeleted?: boolean
}

export interface CreateBranchDto {
  name: string
  code?: string
  description?: string
  isActive?: boolean
}

export interface UpdateBranchDto {
  name?: string
  code?: string
  description?: string
  isActive?: boolean
}

export interface ApiError {
  response?: {
    data?: {
      message?: string
      code?: string
      errors?: Record<string, string[]>
    }
    status?: number
  }
}
