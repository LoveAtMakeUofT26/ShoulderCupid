import { Router } from 'express';

export const ttsRouter = Router();

// ElevenLabs TTS removed — frontend uses browser SpeechSynthesis API.
// This endpoint remains as a stub so existing frontend calls don't 404.
ttsRouter.post('/', (_req, res) => {
  res.status(501).json({
    error: 'Server TTS disabled — use browser speech synthesis',
    useBrowserTts: true,
  });
});
