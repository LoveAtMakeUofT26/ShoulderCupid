import { useScribe } from "@elevenlabs/react";
import { useCallback, useState } from "react";

export interface TranscriptEntry {
  id: string;
  timestamp: number;
  speaker: 'user' | 'target' | 'coach';
  text: string;
  emotion?: string;
}

let inFlightTokenRequest: Promise<string> | null = null;

async function fetchTokenFromServer() {
  if (!inFlightTokenRequest) {
    inFlightTokenRequest = (async () => {
      try {
        const response = await fetch('/api/stt/scribe-token');
        if (!response.ok) {
          throw new Error('Failed to fetch token');
        }
        const data = await response.json();
        return data.token;
      } catch (error) {
        inFlightTokenRequest = null;
        throw error;
      }
    })();
  }

  try {
    return await inFlightTokenRequest;
  } finally {
    inFlightTokenRequest = null;
  }
}

export function useTranscriptionService() {
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [partialTranscript, setPartialTranscript] = useState<string>("");
  
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    onPartialTranscript: (data) => {
      console.log("Partial:", data.text);
      setPartialTranscript(data.text);
    },
    onCommittedTranscript: (data) => {
      console.log("Committed:", data.text);
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
      setPartialTranscript(""); // Clear partial when committed
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

  const startTranscription = useCallback(async () => {
    if (!scribe.isConnected) {
      try {
        const token = await fetchTokenFromServer();
        console.log("🎤 ElevenLabs token:", token);

        // Start ElevenLabs transcription
        await scribe.connect({
          token,
          microphone: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        console.log("🎤 Transcription started");
        
        return token;
      } catch (error) {
        console.error('Failed to start transcription:', error);
      }
    }
  }, [scribe.isConnected]);

  const stopTranscription = useCallback(() => {
    if (scribe.isConnected) {
      scribe.disconnect();
      console.log("🎤 Transcription stopped");
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
