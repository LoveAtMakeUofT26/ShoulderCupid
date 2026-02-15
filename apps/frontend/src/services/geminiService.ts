import { GoogleGenAI, Modality } from '@google/genai';
import { useCallback, useState } from 'react';

export function useGeminiService() {
  const [session, setSession] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [responses, setResponses] = useState<string[]>([]);

  const fetchGeminiToken = async () => {
    const response = await fetch('/api/gemini/token');
    if (!response.ok) {
      throw new Error('Failed to fetch Gemini token');
    }
    const data = await response.json();
    return data.token;
  };

  const connectToGemini = useCallback(async () => {
    try {
      const token = await fetchGeminiToken();
      
      // Use the token generated in the "Create an ephemeral token" section here
      const ai = new GoogleGenAI({
        apiKey: token.name
      });
      const model = 'gemini-2.5-flash-native-audio-preview-12-2025';
      const config = { responseModalities: [Modality.TEXT] };

      const geminiSession = await ai.live.connect({
        model: model,
        config: config,
        callbacks: {
          onopen: () => {
            setIsConnected(true);
          },
          onmessage: (message) => {
            if (message.text) {
              const responseText = String(message.text);
              setResponses(prev => [...prev, responseText]);
            }
          },
          onerror: (error) => {
            console.error("Gemini error:", error);
            setIsConnected(false);
          },
          onclose: () => {
            setIsConnected(false);
          },
        },
      });

      setSession(geminiSession);
      return geminiSession;
    } catch (error) {
      console.error("Failed to connect to Gemini:", error);
      throw error;
    }
  }, []);

  const sendTranscriptToGemini = useCallback(async (transcript: string) => {
    if (!session || !isConnected) return;

    try {
      await session.send({ text: transcript });
    } catch (error) {
      console.error("Failed to send transcript to Gemini:", error);
    }
  }, [session, isConnected]);

  const disconnectFromGemini = useCallback(() => {
    if (session) {
      session.close();
      setSession(null);
      setIsConnected(false);
    }
  }, [session]);

  return {
    isConnected,
    responses,
    connectToGemini,
    sendTranscriptToGemini,
    disconnectFromGemini,
  };
}