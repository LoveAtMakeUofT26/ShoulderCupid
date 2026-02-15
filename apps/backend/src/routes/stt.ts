// Speech-to-Text service for WebSocket audio input
import { Router } from 'express';
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { loadEnv } from '../config/loadEnv.js';
import { RateLimiter } from '../utils/resilience.js';

export const sttRouter = Router();

loadEnv();

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

const scribeTokenLimiter = new RateLimiter(10_000, 30); // 30 req / 10s per IP
const scribeTokenInFlight = new Map<string, Promise<unknown>>();

function getClientKey(req: any): string {
  return req.ip || 'anonymous';
}

const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated?.()) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  next()
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
      const token = await scribeTokenInFlight.get(key);
      res.json(token);
      return;
    } catch (error) {
      console.error("Failed to create scribe token:", error);
      res.status(500).json({ error: "Failed to create scribe token" });
      return;
    }
  }

  const tokenPromise = (async () => {
    return await elevenlabs.tokens.singleUse.create("realtime_scribe");
  })();

  scribeTokenInFlight.set(key, tokenPromise);

  try {
    const token = await tokenPromise;
    res.json(token);
  } catch (error) {
    console.error("Failed to create scribe token:", error);
    res.status(500).json({ error: "Failed to create scribe token" });
  } finally {
    scribeTokenInFlight.delete(key);
  }
});
