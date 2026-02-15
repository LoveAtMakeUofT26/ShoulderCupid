// Service to call backend TTS API and return audio blob

export async function fetchTTS(text: string, voiceId?: string): Promise<Blob> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, ...(voiceId && { voiceId }) }),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch TTS audio');
  }
  return await response.blob();
}
