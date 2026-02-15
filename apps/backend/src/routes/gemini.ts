import { Router } from 'express';
import { GoogleGenAI, Modality } from "@google/genai";
import "dotenv/config";
import { RateLimiter } from '../utils/resilience.js';

export const geminiRouter = Router();

const client = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY,
});

const tokenLimiter = new RateLimiter(10_000, 20); // 20 req / 10s per IP
const tokenInFlight = new Map<string, Promise<unknown>>();

function getClientKey(req: any): string {
  return req.ip || 'anonymous';
}

// Lightweight health check — verifies API key is set without creating a token
geminiRouter.get("/health", (_req, res) => {
  if (process.env.GOOGLE_AI_API_KEY) {
    res.json({ status: "ok" });
  } else {
    res.status(503).json({ error: "GOOGLE_AI_API_KEY not configured" });
  }
});

// Create ephemeral token for live Gemini session (only called when session actually starts)
geminiRouter.get("/token", async (req, res) => {
  const key = getClientKey(req);
  if (!tokenLimiter.allow(key)) {
    res.status(429).json({ error: "Too many token requests. Please wait a moment." });
    return;
  }

  if (!process.env.GOOGLE_AI_API_KEY) {
    res.status(503).json({ error: "GOOGLE_AI_API_KEY not configured" });
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
    console.log(" Created Gemini text token:", token);
    res.json(token);
  } catch (error) {
    console.error("Failed to create Gemini text token:", error);
    res.status(500).json({ error: "Failed to create Gemini text token" });
  } finally {
    tokenInFlight.delete(key);
  }
});
