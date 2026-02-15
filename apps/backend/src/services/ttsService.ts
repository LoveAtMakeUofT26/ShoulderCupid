import axios, { AxiosError } from 'axios'
import { loadEnv } from '../config/loadEnv.js'
import { retryWithBackoff } from '../utils/resilience.js'
import { VOICE_POOL } from '../config/voicePool.js'

loadEnv()

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

function isVoiceNotFound(error: unknown): boolean {
  const axiosErr = error as AxiosError<ArrayBuffer>
  if (axiosErr?.response?.status !== 404) return false
  try {
    const text = Buffer.from(axiosErr.response.data).toString('utf-8')
    return text.includes('voice_not_found')
  } catch {
    return false
  }
}

function getRandomFallbackVoiceId(exclude: string): string {
  const candidates = VOICE_POOL.filter(v => v.voice_id !== exclude)
  return candidates[Math.floor(Math.random() * candidates.length)]!.voice_id
}

async function callTts(text: string, voiceId: string): Promise<Buffer> {
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

export async function generateSpeech(text: string, voiceId: string): Promise<Buffer> {
  try {
    return await callTts(text, voiceId)
  } catch (error) {
    if (isVoiceNotFound(error)) {
      const fallbackId = getRandomFallbackVoiceId(voiceId)
      console.warn(`[TTS] Voice ${voiceId} not found, falling back to ${fallbackId}`)
      return await callTts(text, fallbackId)
    }
    throw error
  }
}
