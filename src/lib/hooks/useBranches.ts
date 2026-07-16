'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { branchApi } from '@/lib/api/branches'
import type { Branch, CreateBranchDto, UpdateBranchDto, ApiError } from '@/types'

export const branchKeys = {
  all: ['branches'] as const,
  lists: () => [...branchKeys.all, 'list'] as const,
  list: (params?: object) => [...branchKeys.lists(), params] as const,
  details: () => [...branchKeys.all, 'detail'] as const,
  detail: (id: string) => [...branchKeys.details(), id] as const,
}

export function useBranches(params?: { includeDeleted?: boolean; limit?: number }) {
  return useQuery({
    queryKey: branchKeys.list(params),
    queryFn: async () => {
      const res = await branchApi.list(params)
      const d = res.data
      const list = Array.isArray(d)
        ? (d as Branch[])
        : (d && typeof d === 'object' && 'data' in d && Array.isArray((d as { data: unknown }).data)
            ? ((d as { data: Branch[] }).data)
            : [])

      return {
        data: list,
        items: list,
      }
    },
    placeholderData: (prev) => prev,
  })
}

export function useBranch(id: string) {
  return useQuery({
    queryKey: branchKeys.detail(id),
    queryFn: async () => {
      const res = await branchApi.get(id)
      const d = res.data as { data?: Branch } | Branch
      if (d && 'data' in d && d.data) return d.data as Branch
      return d as Branch
    },
    enabled: Boolean(id),
  })
}

export function useCreateBranch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateBranchDto) =>
      branchApi.create(data).then((r) => {
        const d = r.data as { data?: Branch } | Branch
        if (d && 'data' in d && d.data) return d.data as Branch
        return d as Branch
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() })
      toast.success('Branch created successfully')
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message ?? 'Failed to create branch')
    },
  })
}

export function useUpdateBranch(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateBranchDto) =>
      branchApi.update(id, data).then((r) => {
        const d = r.data as { data?: Branch } | Branch
        if (d && 'data' in d && d.data) return d.data as Branch
        return d as Branch
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() })
      toast.success('Branch updated successfully')
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message ?? 'Failed to update branch')
    },
  })
}

export function useDeleteBranch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      branchApi.delete(id, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() })
      toast.success('Branch deleted')
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message ?? 'Failed to delete branch')
    },
  })
}
