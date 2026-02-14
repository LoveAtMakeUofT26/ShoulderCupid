import { AppShell, FloatingActionButton } from '../components/layout'

export function SessionsPage() {
  return (
    <AppShell>
      <div className="pt-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Your Sessions
        </h1>
        <p className="text-gray-500 mb-6">
          Review past coaching sessions
        </p>

        {/* Empty state */}
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">💝</div>
          <h3 className="font-semibold text-gray-900 mb-2">No sessions yet</h3>
          <p className="text-gray-500 text-sm mb-6">
            Start your first coaching session to see your history here
          </p>
          <button className="btn-primary mx-auto">
            Start First Session
          </button>
        </div>

        {/* Session list placeholder - will show when there are sessions
        <div className="space-y-3">
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cupid-100 flex items-center justify-center">
              💘
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">Coffee Shop Approach</p>
              <p className="text-sm text-gray-500">2 hours ago • 5 min</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-green-600">8/10</div>
              <div className="text-xs text-gray-400">Score</div>
            </div>
          </div>
        </div>
        */}
      </div>

      <FloatingActionButton to="/session/new" />
    </AppShell>
  )
}
