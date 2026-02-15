import { useScribe } from "@elevenlabs/react";

function SessionStartPage() {
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    onPartialTranscript: (data) => {
      console.log("Partial:", data.text);
    },
    onCommittedTranscript: (data) => {
      console.log("Committed:", data.text);
    },
    onCommittedTranscriptWithTimestamps: (data) => {
      console.log("Committed with timestamps:", data.text);
      console.log("Timestamps:", data.words);
    },
  });

  const fetchTokenFromServer = async () => {
    const response = await fetch('/api/stt/scribe-token');
    if (!response.ok) {
      throw new Error('Failed to fetch token');
    }
    const data = await response.json();
    return data.token;
  };

  const handleStart = async () => {
    try {
      const token = await fetchTokenFromServer();

      await scribe.connect({
        token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--color-text)] mb-8">Session Start</h1>

        <div className="card p-6">
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={handleStart}
                disabled={scribe.isConnected}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {scribe.isConnected ? 'Recording...' : 'Start Recording'}
              </button>

              <button
                onClick={scribe.disconnect}
                disabled={!scribe.isConnected}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Stop
              </button>
            </div>

            {scribe.partialTranscript && (
              <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Live Transcription:</p>
                <p className="text-blue-800 dark:text-blue-300">{scribe.partialTranscript}</p>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-lg font-medium text-[var(--color-text)]">Committed Transcripts:</h3>
              {scribe.committedTranscripts.length === 0 ? (
                <p className="text-[var(--color-text-tertiary)] italic">No transcripts yet. Start recording to see transcripts here.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {scribe.committedTranscripts.map((t) => (
                    <div key={t.id} className="p-3 bg-[var(--color-surface-secondary)] rounded-lg">
                      <p className="text-[var(--color-text)]">{t.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-[var(--color-surface-secondary)] rounded-lg">
              <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Status:</h3>
              <div className="text-sm space-y-1 text-[var(--color-text)]">
                <p>Connected: {scribe.isConnected ? 'Yes' : 'No'}</p>
                <p>Error: {scribe.error || 'None'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionStartPage;
