import { AppShell } from '../components/layout'

export function SettingsPage() {
  return (
    <AppShell>
      <div className="pt-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Settings
        </h1>

        {/* Profile section */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Profile
          </h2>
          <div className="card">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-cupid-100 flex items-center justify-center text-2xl">
                👤
              </div>
              <div>
                <p className="font-semibold text-gray-900">User Name</p>
                <p className="text-sm text-gray-500">user@example.com</p>
              </div>
            </div>
            <button className="text-sm text-cupid-500 font-medium">
              Edit Profile
            </button>
          </div>
        </section>

        {/* Preferences section */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Preferences
          </h2>
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Coaching Style</p>
                <p className="text-sm text-gray-500">How direct your coach is</p>
              </div>
              <span className="text-sm text-cupid-500 font-medium">Balanced</span>
            </div>
            <div className="border-t border-gray-100" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Comfort Sensitivity</p>
                <p className="text-sm text-gray-500">When to trigger warnings</p>
              </div>
              <span className="text-sm text-cupid-500 font-medium">Medium</span>
            </div>
            <div className="border-t border-gray-100" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Theme</p>
                <p className="text-sm text-gray-500">App appearance</p>
              </div>
              <span className="text-sm text-cupid-500 font-medium">Light</span>
            </div>
          </div>
        </section>

        {/* Device section */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Device
          </h2>
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  👓
                </div>
                <div>
                  <p className="font-medium text-gray-900">Cupid Glasses</p>
                  <p className="text-sm text-gray-500">Not connected</p>
                </div>
              </div>
              <button className="btn-ghost text-sm px-3 py-1.5">
                Pair
              </button>
            </div>
          </div>
        </section>

        {/* Account section */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Account
          </h2>
          <div className="card space-y-4">
            <button className="text-left w-full text-gray-900 font-medium">
              Subscription
            </button>
            <div className="border-t border-gray-100" />
            <button className="text-left w-full text-cupid-500 font-medium">
              Log Out
            </button>
            <div className="border-t border-gray-100" />
            <button className="text-left w-full text-red-500 font-medium">
              Delete Account
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
