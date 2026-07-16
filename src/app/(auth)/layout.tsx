import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Sign In',
    template: '%s | AssetFlow',
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="hidden md:flex md:w-[420px] lg:w-[480px] xl:w-[560px] bg-slate-900 flex-col justify-between p-10 xl:p-12 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white"/>
                <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.6"/>
                <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.6"/>
                <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white"/>
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">AssetFlow</span>
          </div>
          <div className="mt-16">
            <h1 className="text-white text-3xl font-bold leading-tight">
              The fixed asset register your auditor will trust.
            </h1>
            <p className="text-slate-400 text-base mt-4 leading-relaxed">
              Replace disconnected spreadsheets with a single system of record for your physical assets.
            </p>
          </div>
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-600/40 flex items-center justify-center flex-shrink-0">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-slate-300 text-sm">Asset lifecycle tracking from purchase to disposal</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-600/40 flex items-center justify-center flex-shrink-0">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-slate-300 text-sm">Automated recognition and capitalization decisions</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-600/40 flex items-center justify-center flex-shrink-0">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-slate-300 text-sm">Audit-ready depreciation and disposal records</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-600/40 flex items-center justify-center flex-shrink-0">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-slate-300 text-sm">Branch management and asset assignment</span>
            </div>
          </div>
        </div>
        <p className="text-slate-500 text-xs border-t border-slate-800 pt-8">
          2025 AssetFlow. Built for African enterprise.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="flex items-center gap-2.5 mb-8 md:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white"/>
                <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.6"/>
                <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.6"/>
                <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white"/>
              </svg>
            </div>
            <span className="text-slate-900 font-bold text-lg tracking-tight">AssetFlow</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
