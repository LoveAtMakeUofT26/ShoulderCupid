import { Router } from 'express';
import { GoogleGenAI, Modality } from "@google/genai";
import "dotenv/config";

export const geminiRouter = Router();

const client = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY,
});

