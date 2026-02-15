// Speech-to-Text service for WebSocket audio input
import { Router } from 'express';
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import "dotenv/config";

export const sttRouter = Router();

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

sttRouter.get("/scribe-token", async (req, res) => {
  try {
    const token = await elevenlabs.tokens.singleUse.create("realtime_scribe");
    console.log("🎤 Created scribe token:", token);
    res.json(token);
  } catch (error) {
    console.error("Failed to create scribe token:", error);
    res.status(500).json({ error: "Failed to create scribe token" });
  }
});
