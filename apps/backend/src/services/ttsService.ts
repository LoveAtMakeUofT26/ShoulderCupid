import axios from 'axios'
import { loadEnv } from '../config/loadEnv.js'
import { retryWithBackoff } from '../utils/resilience.js'

loadEnv()

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

export async function generateSpeech(text: string, voiceId: string): Promise<Buffer> {
  const response = await retryWithBackoff(
    () => axios.post(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/stream`,
      {
        text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        responseType: 'arraybuffer',
      }
    ),
    { maxRetries: 2, baseDelayMs: 800 }
  )

  return Buffer.from(response.data)
}
