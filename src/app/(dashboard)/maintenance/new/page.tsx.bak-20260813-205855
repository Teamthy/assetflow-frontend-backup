'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { variants } from '@/lib/animations/tokens'

export default function NewMaintenancePage() {
  const router = useRouter()
  return (
    <div className="p-6 max-w-2xl">
      <motion.div variants={variants.fadeUp} initial="hidden" animate="visible" className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Maintenance
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Maintenance Task</h1>
        <p className="text-sm text-slate-500 mt-0.5">Schedule a new maintenance task for an asset</p>
      </motion.div>
      <motion.div
        variants={variants.fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card p-6"
      >
        <p className="text-slate-500 text-sm">Create maintenance task form — implement per specification</p>
      </motion.div>
    </div>
  )
}
