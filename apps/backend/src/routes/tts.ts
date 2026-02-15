import express from 'express';

const ttsRouter = express.Router();

ttsRouter.post('/', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid text' });
    }
    const audioBuffer = await createAudioStreamFromText(text, voiceId);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'inline; filename="tts.mp3"',
    });
    res.send(audioBuffer);
  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ error: 'Failed to generate audio' });
  }
});

export { ttsRouter };
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import * as dotenv from 'dotenv';

dotenv.config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  throw new Error('Missing ELEVENLABS_API_KEY in environment variables');
}

const elevenlabs = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

const DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'

export const createAudioStreamFromText = async (text: string, voiceId?: string): Promise<Buffer> => {
  const audioStream = await elevenlabs.textToSpeech.stream(voiceId || DEFAULT_VOICE_ID, {
    modelId: 'eleven_multilingual_v2',
    text,
    outputFormat: 'mp3_44100_128',
    // Optional voice settings that allow you to customize the output
    voiceSettings: {
      stability: 0,
      similarityBoost: 1.0,
      useSpeakerBoost: true,
      speed: 1.0,
    },
  });

  const chunks: Buffer[] = [];
  for await (const chunk of audioStream) {
    // Ensure chunk is a Buffer (convert from Uint8Array if needed)
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const content = Buffer.concat(chunks);
  return content;
};
