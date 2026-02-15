import { useScribe } from "@elevenlabs/react";
import { useCallback, useRef, useState } from "react";

const MAX_STT_RETRIES = 3;

export interface TranscriptEntry {
  id: string;
  timestamp: number;
  speaker: 'user' | 'target' | 'coach';
  text: string;
  emotion?: string;
}

export function useTranscriptionService() {
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [partialTranscript, setPartialTranscript] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    onPartialTranscript: (data) => {
      setPartialTranscript(data.text);
    },
    onCommittedTranscript: (data) => {
      const newEntry: TranscriptEntry = {
        id: `elevenlabs-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: Date.now(),
        speaker: 'user',
        text: data.text,
        emotion: 'neutral'
      };
      setTranscripts(prev => {
        const updated = [...prev, newEntry];
        return updated.length > 50 ? updated.slice(-50) : updated;
      });
      setPartialTranscript("");
    },
    onCommittedTranscriptWithTimestamps: () => {},
    onError: (err) => {
      console.error('[Scribe] WebSocket error:', err);
      setError('Transcription error — check console for details');
    },
    onDisconnect: () => {
      console.warn('[Scribe] WebSocket disconnected');
    },
  });

  const fetchTokenFromServer = async () => {
    const response = await fetch('/api/stt/scribe-token', {
      credentials: 'include',
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Token fetch failed (${response.status})`);
    }
    const data = await response.json();
    return data.token;
  };

  const startTranscription = useCallback(async () => {
    if (retryCountRef.current >= MAX_STT_RETRIES) {
      setError('Transcription unavailable — too many failed attempts');
      return;
    }

    if (!scribe.isConnected) {
      try {
        setError(null);
        const token = await fetchTokenFromServer();

        await scribe.connect({
          token,
          microphone: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        retryCountRef.current = 0;
        return token;
      } catch (err) {
        retryCountRef.current += 1;
        const msg = err instanceof Error ? err.message : 'Failed to start transcription';
        console.error(`[Scribe] Failed to start transcription (attempt ${retryCountRef.current}/${MAX_STT_RETRIES}):`, err);
        setError(msg);
      }
    }
  }, [scribe]);

  const stopTranscription = useCallback(() => {
    if (scribe.isConnected) {
      scribe.disconnect();
    }
    setError(null);
  }, [scribe]);

  return {
    transcripts,
    partialTranscript,
    isConnected: scribe.isConnected,
    startTranscription,
    stopTranscription,
    error,
  };
}
