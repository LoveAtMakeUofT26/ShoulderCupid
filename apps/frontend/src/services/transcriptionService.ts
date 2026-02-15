import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { useCallback, useRef, useState } from "react";

const MAX_STT_RETRIES = 3;

// Regex: sentence-ending punctuation followed by whitespace or end of string
const SENTENCE_BOUNDARY = /[.!?](?:\s|$)/;

export interface TranscriptEntry {
  id: string;
  timestamp: number;
  speaker: 'user' | 'target' | 'coach';
  text: string;
  emotion?: string;
}

function makeEntry(text: string): TranscriptEntry {
  return {
    id: `elevenlabs-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    speaker: 'user',
    text,
    emotion: 'neutral',
  };
}

export function useTranscriptionService() {
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [partialTranscript, setPartialTranscript] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);

  // Track text already promoted from partials so we don't double-send on commit
  const sentPrefixRef = useRef("");

  const addEntries = useCallback((texts: string[]) => {
    if (texts.length === 0) return;
    setTranscripts(prev => {
      const updated = [...prev, ...texts.map(makeEntry)];
      return updated.length > 50 ? updated.slice(-50) : updated;
    });
  }, []);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    onPartialTranscript: (data) => {
      const text = data.text;
      setPartialTranscript(text);

      // Detect complete sentences in the partial and promote them early
      const alreadySent = sentPrefixRef.current;
      const unsent = alreadySent && text.startsWith(alreadySent)
        ? text.slice(alreadySent.length)
        : text;

      if (!unsent.trim()) return;

      // Find the last sentence boundary in the unsent portion
      let lastBoundary = -1;
      SENTENCE_BOUNDARY.lastIndex = 0;
      let match: RegExpExecArray | null;
      const re = new RegExp(SENTENCE_BOUNDARY.source, 'g');
      while ((match = re.exec(unsent)) !== null) {
        lastBoundary = match.index + match[0].length;
      }

      if (lastBoundary > 0) {
        const completeSentences = unsent.slice(0, lastBoundary).trim();
        if (completeSentences) {
          addEntries([completeSentences]);
          sentPrefixRef.current = alreadySent + unsent.slice(0, lastBoundary);
          // Update partial to show only the remainder
          const remainder = unsent.slice(lastBoundary).trim();
          setPartialTranscript(remainder);
        }
      }
    },
    onCommittedTranscript: (data) => {
      const fullText = data.text;
      const alreadySent = sentPrefixRef.current;

      // Only send the portion not already promoted from partials
      const unsent = alreadySent && fullText.startsWith(alreadySent)
        ? fullText.slice(alreadySent.length).trim()
        : fullText.trim();

      if (unsent) {
        addEntries([unsent]);
      }

      // Reset for next utterance
      sentPrefixRef.current = "";
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
          commitStrategy: CommitStrategy.VAD,
          vadSilenceThresholdSecs: 0.5,
          minSilenceDurationMs: 300,
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
