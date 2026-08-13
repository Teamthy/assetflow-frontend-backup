export function OnboardingComplete({ completedSteps = [] }: { completedSteps?: number[] }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-3">
        <h2 className="text-2xl font-semibold">Setup complete</h2>
        <p className="text-sm text-slate-500">
          {completedSteps.length} of 4 setup steps finished. You can keep configuring from Settings.
        </p>
      </div>
    </div>
  )
}
