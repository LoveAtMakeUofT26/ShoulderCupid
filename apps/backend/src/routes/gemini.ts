import { Router } from 'express';

export const geminiRouter = Router();

// Gemini/OpenAI APIs removed — coaching and advice are now template-based.

const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated?.()) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  next()
}

// Health check — return OK so preflight doesn't block sessions
geminiRouter.get("/health", requireAuth, (_req, res) => {
  res.json({ status: "ok", mode: "template" });
});

// POST /api/gemini/advice — return template advice
geminiRouter.post('/advice', (_req, res) => {
  res.json({ advice: 'Stay confident and be yourself.' });
});

// GET /api/gemini/token — no longer needed
geminiRouter.get("/token", requireAuth, (_req, res) => {
  res.status(501).json({ error: "Gemini tokens disabled — coaching is template-based" });
});
