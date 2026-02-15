import { Router } from 'express';
import { GoogleGenAI, Modality } from "@google/genai";
import "dotenv/config";

export const geminiRouter = Router();

const client = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY,
});

geminiRouter.get("/token", async (_req, res) => {
  try {
    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    
    const token = await client.authTokens.create({
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

    console.log(" Created Gemini text token:", token);
    res.json(token);
  } catch (error) {
    console.error("Failed to create Gemini text token:", error);
    res.status(500).json({ error: "Failed to create Gemini text token" });
  }
});