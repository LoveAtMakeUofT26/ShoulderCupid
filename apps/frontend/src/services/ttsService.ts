// Service to call backend TTS API and return audio blob

export async function fetchTTS(text: string): Promise<Blob> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch TTS audio');
  }
  return await response.blob();
}
