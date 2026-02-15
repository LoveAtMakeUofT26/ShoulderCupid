import { Router } from 'express';
import { GoogleGenAI, Modality } from "@google/genai";
import "dotenv/config";
import { getRelationshipAdvice, type TranscriptEntry } from '../services/relationshipAdviceAgent.js';

export const geminiRouter = Router();

const client = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY,
});

// Fallback when Gemini is unavailable (quota, key, etc.)
const FALLBACK_ADVICE = 'Listen, then share a bit.';

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
