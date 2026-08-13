'use client'

import { useForm } from 'react-hook-form'
import { formResolver } from '@/lib/validations/form-resolver'
import { CheckCircle2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form'
import { completeMaintenanceSchema, type CompleteMaintenanceFormValues } from '@/lib/validations/maintenance'
import { useCompleteMaintenance } from '@/lib/hooks/useMaintenance'
import type { MaintenanceTask } from '@/types'

interface CompleteMaintenanceModalProps {
  task: MaintenanceTask
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CompleteMaintenanceModal({ task, open, onOpenChange }: CompleteMaintenanceModalProps) {
  const completeMutation = useCompleteMaintenance(task.id)

  const form = useForm<CompleteMaintenanceFormValues>({
    resolver: formResolver(completeMaintenanceSchema),
    defaultValues: {
      completionNote: '',
      completedAt: new Date().toISOString().split('T')[0],
    },
  })

  async function onSubmit(values: CompleteMaintenanceFormValues) {
    try {
      await completeMutation.mutateAsync({
        completionNote: values.completionNote,
        note: values.completionNote,
        completedAt: values.completedAt,
      })
      form.reset()
      onOpenChange(false)
    } catch {
      // toast in hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) form.reset(); onOpenChange(o) }}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle>Complete task</DialogTitle>
              <DialogDescription>Mark {task.title} as completed.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-4">
              <FormField control={form.control} name="completedAt" render={({ field }) => (
                <FormItem>
                  <FormLabel>Completion date <span className="text-red-500">*</span></FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="completionNote" render={({ field }) => (
                <FormItem>
                  <FormLabel>Completion note <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Describe what was done, parts replaced, findings, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Minimum 5 characters. This becomes part of the asset audit trail.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
                The linked asset will return to active status if this is the last open task.
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={completeMutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Completing...
                  </>
                ) : 'Mark as completed'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
