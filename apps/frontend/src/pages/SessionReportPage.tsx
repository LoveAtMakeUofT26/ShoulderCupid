import { AppShell } from '../components/layout'

export function SessionReportPage() {

  return (
    <AppShell>
      <div className="pt-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Session Report
        </h1>
        <p className="text-gray-500 mb-6">
          Review your coaching session
        </p>

        <div className="card text-center py-12">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="font-semibold text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-gray-500 text-sm">
            Session reports will be available after your first coaching session.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
