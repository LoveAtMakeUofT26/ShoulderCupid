import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { loadEnv } from '../config/loadEnv.js'
import { retryWithBackoff } from '../utils/resilience.js'

loadEnv()

const apiKey = process.env.ELEVENLABS_API_KEY
if (!apiKey) {
  console.warn('WARNING: ELEVENLABS_API_KEY not set. TTS will fail.')
}

const elevenlabs = new ElevenLabsClient({
  apiKey: apiKey || '',
})

/**
 * Convert text to speech using ElevenLabs streaming API.
 * Uses the same ELEVENLABS_API_KEY as STT (scribe token creation).
 */
export async function generateSpeech(text: string, voiceId: string): Promise<Buffer> {
  return retryWithBackoff(
    async () => {
      const audioStream = await elevenlabs.textToSpeech.stream(voiceId, {
        modelId: 'eleven_multilingual_v2',
        text,
        outputFormat: 'mp3_44100_128',
        voiceSettings: {
          stability: 0,
          similarityBoost: 1.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      })

      const chunks: Buffer[] = []
      for await (const chunk of audioStream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      }

      return Buffer.concat(chunks)
    },
    { maxRetries: 2, baseDelayMs: 800 }
  )
}
