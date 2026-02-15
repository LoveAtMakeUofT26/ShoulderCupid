import { Router } from 'express';
import { generateSpeech } from '../services/ttsService.js';

export const ttsRouter = Router();

ttsRouter.post('/', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid text' });
    }
    // Use default voice if not provided
    // ElevenLabs "Adam" (public voice) keeps dev/prod behavior consistent with socket TTS fallback.
    const voice = typeof voiceId === 'string' && voiceId ? voiceId : 'pNInz6obpgDQGcFmaJgB';
    const audioBuffer = await generateSpeech(text, voice);
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
