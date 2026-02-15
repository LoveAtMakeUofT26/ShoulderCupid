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
    console.log("🤖 Gemini token fetched:", data.name);
    return data.name;
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
            console.log("🤖 Gemini session opened");
            setIsConnected(true);
          },
          onmessage: (message) => {
            console.log("🤖 Gemini message:", message);
            // Handle Gemini responses here
            if (message.text) {
              const responseText = String(message.text);
              console.log("🤖 Gemini Response:", responseText);
              setResponses(prev => [...prev, responseText]);
            }
          },
          onerror: (error) => {
            console.error("🤖 Gemini error:", error);
            setIsConnected(false);
          },
          onclose: () => {
            console.log("🤖 Gemini session closed");
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
    if (!session || !isConnected) {
      console.warn("Gemini session not connected");
      return;
    }

    try {
      // Send content with system prompt
      await session.send({
        text: `You are a dating and social coach. Provide helpful, practical advice based on the conversation. Be supportive and encouraging.

User said: "${transcript}"`
      });
      console.log("📤 Sent transcript to Gemini:", transcript);
    } catch (error) {
      console.error("Failed to send transcript to Gemini:", error);
    }
  }, [session, isConnected]);

  const disconnectFromGemini = useCallback(() => {
    if (session) {
      session.close();
      setSession(null);
      setIsConnected(false);
      console.log("🤖 Gemini session disconnected");
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