import { useScribe } from "@elevenlabs/react";
import { useCallback, useState } from "react";

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
  
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    onPartialTranscript: (data) => {
      setPartialTranscript(data.text);
    },
    onCommittedTranscript: (data) => {
      const newEntry: TranscriptEntry = {
        id: `elevenlabs-${Date.now()}`,
        timestamp: Date.now(),
        speaker: 'user',
        text: data.text,
        emotion: 'neutral'
      };
      setTranscripts(prev => {
        const updated = [...prev, newEntry];
        return updated.length > 50 ? updated.slice(-50) : updated;
      });
      setPartialTranscript(""); // Clear partial when committed
    },
    onCommittedTranscriptWithTimestamps: () => {
      // Timestamp data available if needed
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

  const startTranscription = useCallback(async () => {
    if (!scribe.isConnected) {
      try {
        const token = await fetchTokenFromServer();

        await scribe.connect({
          token,
          microphone: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        return token;
      } catch (error) {
        console.error('Failed to start transcription:', error);
      }
    }
  }, [scribe.isConnected]);

  const stopTranscription = useCallback(() => {
    if (scribe.isConnected) {
      scribe.disconnect();
    }
  }, [scribe.isConnected]);

  return {
    transcripts,
    partialTranscript,
    isConnected: scribe.isConnected,
    startTranscription,
    stopTranscription,
  };
}
