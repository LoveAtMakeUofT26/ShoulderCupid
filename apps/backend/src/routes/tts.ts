import { Router } from 'express'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export const ttsRouter = Router()

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
})

async function createAudioStreamFromText(text: string): Promise<Buffer> {
  const audioStream = await elevenlabs.textToSpeech.stream('JBFqnCBsd6RMkjVDRZzb', {
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
}

ttsRouter.post('/', async (req, res) => {
  try {
    const { text } = req.body
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid text' })
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return res.status(503).json({ error: 'ELEVENLABS_API_KEY not configured' })
    }

    const audioBuffer = await createAudioStreamFromText(text)
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'inline; filename="tts.mp3"',
    })
    res.send(audioBuffer)
  } catch (err) {
    console.error('TTS error:', err)
    res.status(500).json({ error: 'Failed to generate audio' })
  }
})
