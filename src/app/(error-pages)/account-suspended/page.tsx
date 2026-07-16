import { XCircle, Mail } from 'lucide-react'

export default function AccountSuspendedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Account Suspended</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Your account has been suspended by your organization administrator.
          Please contact your administrator to restore access.
        </p>
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-left mb-6">
          <p className="text-sm font-semibold text-slate-700 mb-1">Need help?</p>
          <p className="text-sm text-slate-500">
            Reach out to your organization administrator or contact AssetFlow support.
          </p>
        </div>
        <a
          href="mailto:support@assetflow.co"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg border border-slate-200 transition-all duration-150"
        >
          <Mail className="w-4 h-4" />
          Contact Support
        </a>
      </div>
    </div>
  )
}
