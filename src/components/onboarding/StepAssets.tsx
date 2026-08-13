export function StepAssets({
  onNext,
  onBack,
  onSkip,
}: {
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}) {
  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8">
      <div>
        <h2 className="text-2xl font-semibold">Add your first assets</h2>
        <p className="mt-2 text-sm text-slate-500">Import a spreadsheet or add assets later from the register.</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <button onClick={onBack} className="text-sm text-slate-500">Back</button>
          <button onClick={onSkip} className="text-sm text-slate-500">Skip</button>
        </div>
        <button onClick={onNext} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          Continue
        </button>
      </div>
    </div>
  )
}
