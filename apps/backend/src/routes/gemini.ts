import { Router } from 'express';
import { GoogleGenAI, Modality } from "@google/genai";
import { loadEnv } from '../config/loadEnv.js';
import { RateLimiter } from '../utils/resilience.js';
import { getRelationshipAdvice, type TranscriptEntry } from '../services/relationshipAdviceAgent.js';

export const geminiRouter = Router();

loadEnv();

const client = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY,
});

const tokenLimiter = new RateLimiter(10_000, 20); // 20 req / 10s per IP
const tokenInFlight = new Map<string, Promise<unknown>>();

// Fallback when Gemini is unavailable (quota, key, etc.)
const FALLBACK_ADVICE = 'Listen, then share a bit.';

function getClientKey(req: any): string {
  return req.ip || 'anonymous';
}

const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated?.()) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  next()
}

// Lightweight health check — verifies API key is set without creating a token
geminiRouter.get("/health", requireAuth, (_req, res) => {
  if (process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY) {
    res.json({ status: "ok" });
  } else {
    res.status(503).json({ error: "Gemini API key not configured (GOOGLE_AI_API_KEY or GEMINI_API_KEY)" });
  }
});

// POST /api/gemini/advice - Get relationship advice from transcript
geminiRouter.post('/advice', async (req, res) => {
  try {
    const { transcript } = req.body as { transcript: TranscriptEntry[] };
    if (!Array.isArray(transcript)) {
      return res.status(400).json({ error: 'Request body must include transcript array' });
    }

    const advice = await getRelationshipAdvice(transcript);
    res.json({ advice });
  } catch (error: unknown) {
    console.error('Relationship advice error:', error);
    // Return 200 with fallback so the UI keeps working when Gemini fails (quota, key, etc.)
    res.status(200).json({ advice: FALLBACK_ADVICE });
  }
});

// Create ephemeral token for live Gemini session (only called when session actually starts)
geminiRouter.get("/token", requireAuth, async (req, res) => {
  const key = getClientKey(req);
  if (!tokenLimiter.allow(key)) {
    res.status(429).json({ error: "Too many token requests. Please wait a moment." });
    return;
  }

  if (!process.env.GOOGLE_AI_API_KEY && !process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: "Gemini API key not configured (GOOGLE_AI_API_KEY or GEMINI_API_KEY)" });
    return;
  }

  if (tokenInFlight.has(key)) {
    try {
      const token = await tokenInFlight.get(key);
      res.json(token);
      return;
    } catch (error) {
      console.error("Failed to create Gemini text token:", error);
      res.status(500).json({ error: "Failed to create Gemini text token" });
      return;
    }
  }

  const tokenPromise = (async () => {
    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    return await client.authTokens.create({
      config: {
        uses: 1,
        expireTime: expireTime,
        liveConnectConstraints: {
          model: 'gemini-2.5-flash',
          config: {
            temperature: 0.7,
            responseModalities: [Modality.TEXT]
          }
        },
        httpOptions: {
          apiVersion: 'v1alpha'
        }
      }
    });
  })();

  tokenInFlight.set(key, tokenPromise);

  try {
    const token = await tokenPromise;
    res.json(token);
  } catch (error) {
    console.error("Failed to create Gemini text token:", error);
    res.status(500).json({ error: "Failed to create Gemini text token" });
  } finally {
    tokenInFlight.delete(key);
  }
});
