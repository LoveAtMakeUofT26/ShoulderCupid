// Speech-to-Text service for WebSocket audio input
import { Router } from 'express';
import { loadEnv } from '../config/loadEnv.js';
import { RateLimiter, retryWithBackoff } from '../utils/resilience.js';

export const sttRouter = Router();

loadEnv();

const ELEVENLABS_STT_TOKEN_URL = 'https://api.elevenlabs.io/v1/speech-to-text/get-realtime-token';

const scribeTokenLimiter = new RateLimiter(10_000, 30); // 30 req / 10s per IP
const scribeTokenInFlight = new Map<string, Promise<{ token: string }>>();

function getClientKey(req: any): string {
  return req.ip || 'anonymous';
}

const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated?.()) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  next()
}

async function createScribeToken(): Promise<{ token: string }> {
  const response = await fetch(ELEVENLABS_STT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
    },
    body: JSON.stringify({
      model_id: 'scribe_v2_realtime',
      ttl_secs: 300,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`ElevenLabs token request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { token: string };
  return { token: data.token };
}

sttRouter.get("/health", (_req, res) => {
  if (!process.env.ELEVENLABS_API_KEY) {
    res.status(503).json({ error: "ELEVENLABS_API_KEY not configured" });
    return;
  }

  res.json({ status: "ok" });
});

sttRouter.get("/scribe-token", requireAuth, async (req, res) => {
  const key = getClientKey(req);
  if (!scribeTokenLimiter.allow(key)) {
    res.status(429).json({ error: "Too many token requests. Please wait a moment." });
    return;
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    res.status(503).json({ error: "ELEVENLABS_API_KEY not configured" });
    return;
  }

  if (scribeTokenInFlight.has(key)) {
    try {
      const result = await scribeTokenInFlight.get(key);
      res.json(result);
      return;
    } catch (error) {
      console.error("Failed to create scribe token:", error);
      res.status(500).json({ error: "Failed to create scribe token" });
      return;
    }
  }

  const tokenPromise = retryWithBackoff(createScribeToken, {
    maxRetries: 2,
    baseDelayMs: 800,
  });

  scribeTokenInFlight.set(key, tokenPromise);

  try {
    const result = await tokenPromise;
    res.json(result);
  } catch (error) {
    console.error("Failed to create scribe token:", error);
    res.status(500).json({ error: "Failed to create scribe token" });
  } finally {
    scribeTokenInFlight.delete(key);
  }
});
