import { Router } from 'express';

export const sttRouter = Router();

// ElevenLabs STT removed — frontend uses browser SpeechRecognition API.

sttRouter.get("/health", (_req, res) => {
  // Report as unavailable so preflight check knows to use browser fallback
  res.status(503).json({ error: "ElevenLabs STT disabled — using browser speech recognition" });
});

sttRouter.get("/scribe-token", (_req, res) => {
  res.status(501).json({ error: "ElevenLabs STT disabled — use browser speech recognition" });
});
