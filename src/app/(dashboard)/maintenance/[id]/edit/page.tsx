'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { maintenanceApi } from '@/lib/api/maintenance'
import { maintenanceKeys } from '@/lib/hooks/useMaintenance'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/PageHeader'
import { useEffect } from 'react'

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']),
  dueDate: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function EditMaintenancePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: task, isLoading } = useQuery({
    queryKey: maintenanceKeys.detail(id),
    queryFn: () => maintenanceApi.get(id),
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      })
    }
  }, [task, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) => maintenanceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() })
      toast.success('Maintenance task updated')
      router.push(`/maintenance/${id}`)
    },
    onError: () => toast.error('Failed to update task'),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-96 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    )
  }
  if (!task) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Edit Maintenance Task"
        subtitle={task.title}
        breadcrumb={[
          { label: 'Maintenance', href: '/maintenance' },
          { label: task.title, href: `/maintenance/${id}` },
          { label: 'Edit' },
        ]}
      />
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Task Details</h3>
          </div>
          <div className="px-6 py-5 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Title <span className="text-red-500">*</span></label>
              <input {...register('title')} className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 transition-all" />
              {errors.title && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea {...register('description')} rows={3} className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 transition-all resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Priority</label>
                <select {...register('priority')} className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 appearance-none">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <select {...register('status')} className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 appearance-none">
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Due Date</label>
              <input type="date" {...register('dueDate')} className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 transition-all" />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <Link href={`/maintenance/${id}`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg border border-slate-200 transition-all">
              <ArrowLeft className="w-4 h-4" />Cancel
            </Link>
            <button type="submit" disabled={mutation.isPending} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50">
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
