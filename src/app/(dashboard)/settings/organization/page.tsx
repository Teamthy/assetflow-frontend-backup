'use client'
import { motion } from 'framer-motion'
import { variants } from '@/lib/animations/tokens'
import { useAuthStore } from '@/lib/stores/auth'

export default function OrganizationSettingsPage() {
  const organization = useAuthStore((s) => s.organization)

  return (
    <div className="p-6 max-w-2xl">
      <motion.div variants={variants.fadeUp} initial="hidden" animate="visible" className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Organization Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">Update your organization details and branding</p>
      </motion.div>

      <motion.div
        variants={variants.fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card p-6 space-y-5"
      >
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Organization Name</label>
          <input
            defaultValue={organization?.name ?? ''}
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Organization Slug</label>
          <input
            defaultValue={organization?.slug ?? ''}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 focus:outline-none transition-all"
            readOnly
          />
          <p className="text-xs text-slate-400">Used for organization login. Contact support to change.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">RC Number</label>
          <input
            defaultValue={organization?.rcNumber ?? ''}
            placeholder="RC123456"
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition-colors"
        >
          Save Changes
        </motion.button>
      </motion.div>
    </div>
  )
}
