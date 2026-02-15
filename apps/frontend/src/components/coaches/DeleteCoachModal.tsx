import { motion, AnimatePresence } from 'framer-motion'

interface DeleteCoachModalProps {
  open: boolean
  coachName: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function DeleteCoachModal({
  open,
  coachName,
  onConfirm,
  onCancel,
  loading,
}: DeleteCoachModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-coach-title"
          >
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg">
              <h3 id="delete-coach-title" className="font-display text-lg font-bold text-gray-900 mb-2">
                Remove {coachName}?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                This coach will be permanently removed from your roster.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-marble-100 hover:bg-marble-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
