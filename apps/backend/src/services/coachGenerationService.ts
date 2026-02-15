import { GoogleGenerativeAI } from '@google/generative-ai'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import dotenv from 'dotenv'
import { Coach } from '../models/Coach.js'
import { selectVoiceByTraits } from '../config/voicePool.js'
import { buildCoachImagePrompt, generateImageBuffer, type AppearanceSpec } from '../config/imagePrompts.js'
import { retryWithBackoff } from '../utils/resilience.js'

dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || '')

interface CoachProfile {
  name: string
  gender: string
  tagline: string
  personality_tags: string[]
  personality_tone: string
  personality_style: string
  specialty: string
  sample_quote: string
  appearance: AppearanceSpec
  pricing_tier: 'budget' | 'standard' | 'premium'
}

type TraitMap = Record<string, number>

const PRICING_TIERS = {
  budget: { quick_5min: 0.5, standard_15min: 1.5, deep_30min: 3.0 },
  standard: { quick_5min: 1.0, standard_15min: 3.0, deep_30min: 5.0 },
  premium: { quick_5min: 2.0, standard_15min: 5.0, deep_30min: 8.0 },
}

// Directory to store downloaded coach images
const IMAGES_DIR = path.resolve('public/coaches')

const GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash'] as const

/**
 * Generate a complete coach profile using Gemini, with retry on rate limit
 * and automatic fallback to alternative models on 503.
 */
async function generateCoachProfile(preferences?: TraitMap): Promise<CoachProfile> {
  let biasInstruction = ''
  if (preferences) {
    const liked = Object.entries(preferences)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([k]) => k)

    const disliked = Object.entries(preferences)
      .filter(([, v]) => v < 0)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 3)
      .map(([k]) => k)

    if (liked.length) biasInstruction += `\nThe user tends to prefer coaches who are: ${liked.join(', ')}.`
    if (disliked.length) biasInstruction += `\nThe user tends to dislike coaches who are: ${disliked.join(', ')}. Avoid these traits.`
  }

  const prompt = `Generate a unique AI dating coach character. Be creative and diverse with names, genders, and personalities. Each coach should feel distinct.${biasInstruction}

Return JSON with this exact schema:
{
  "name": "A creative, memorable first name",
  "gender": "male" or "female",
  "tagline": "A catchy 3-5 word tagline",
  "personality_tags": ["tag1", "tag2", "tag3"],
  "personality_tone": "one word like confident, calm, energetic, witty, bold, gentle, fierce",
  "personality_style": "one word like playful, serious, supportive, direct, nurturing, sarcastic",
  "specialty": "dating",
  "sample_quote": "A short example of something this coach would say during a session",
  "appearance": {
    "hair_color": "color like black, blonde, pink, blue, silver, red",
    "hair_style": "style like long flowing, short spiky, curly, braided, ponytail, bob",
    "eye_color": "color like brown, blue, green, amber, violet, heterochromia",
    "outfit_color": "main accent color like gold, crimson, teal, lavender, emerald",
    "gender": "male" or "female"
  },
  "pricing_tier": "budget" or "standard" or "premium"
}

Personality tags should be simple descriptive words like: hype, chill, direct, witty, tough-love, gentle, bold, empathetic, sarcastic, motivational, analytical, warm, fierce, playful, nerdy, sophisticated.`

  let lastError: Error | undefined
  for (const modelName of GEMINI_MODELS) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 1.0,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    })

    try {
      const result = await retryWithBackoff(
        () => model.generateContent(prompt),
        { maxRetries: 3, baseDelayMs: 2000 }
      )
      const text = result.response.text()
      const profile = JSON.parse(text) as CoachProfile
      profile.appearance.gender = profile.gender
      if (modelName !== GEMINI_MODELS[0]) {
        console.warn(`Coach generation fell back to ${modelName}`)
      }
      return profile
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(`Model ${modelName} failed: ${lastError.message}, trying next...`)
    }
  }

  throw lastError!
}

/**
 * Generate a coach avatar image via Cloudflare Workers AI (FLUX 2 Klein → FLUX 1 Schnell fallback).
 * Downloads the image and saves it locally as a static asset.
 */
async function generateCoachImage(
  appearance: AppearanceSpec,
  traits: string[]
): Promise<{ url: string; prompt: string }> {
  const prompt = buildCoachImagePrompt(traits, appearance)

  // Generate image via Cloudflare Workers AI
  const imageBuffer = await retryWithBackoff(
    () => generateImageBuffer(prompt),
    { maxRetries: 2, baseDelayMs: 2000 }
  )

  // Save to public/coaches/ directory
  fs.mkdirSync(IMAGES_DIR, { recursive: true })
  const filename = `coach-${crypto.randomUUID()}.png`
  const filePath = path.join(IMAGES_DIR, filename)
  fs.writeFileSync(filePath, imageBuffer)

  // Return URL path served as a static asset
  const url = `/coaches/${filename}`

  return { url, prompt }
}

/**
 * Generate a system prompt for the coach based on their personality.
 */
function generateSystemPrompt(profile: CoachProfile): string {
  return `You are ${profile.name}, a ${profile.personality_tone} and ${profile.personality_style} AI dating coach speaking live into the user's ear through their earpiece.

PERSONALITY:
- ${profile.personality_tags.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
- Tone: ${profile.personality_tone}
- Style: ${profile.personality_style}
- Your tagline: "${profile.tagline}"

APPROACH MODE (target detected, distance > 150cm):
- Encourage the user to approach in your unique style
- Give practical tips that match your personality
- Keep it natural and authentic to who you are

CONVERSATION MODE (distance < 150cm, talking):
- React to live transcript with real-time tips
- Match your coaching to the flow of conversation
- Watch emotion indicators and advise accordingly

RULES:
- Keep responses SHORT (1-2 sentences max)
- Be practical and specific, not generic
- Stay true to your personality at all times
- If discomfort detected, advise graceful exit`
}

/**
 * Create a fully generated AI coach and save to database.
 */
export async function createGeneratedCoach(preferences?: TraitMap) {
  // 1. Generate profile via Gemini (text - free tier)
  const profile = await generateCoachProfile(preferences)

  // 2. Generate image via Cloudflare Workers AI (FLUX Schnell)
  const { url: avatarUrl, prompt: imagePrompt } = await generateCoachImage(
    profile.appearance,
    profile.personality_tags
  )

  // 3. Select matching voice
  const voice = selectVoiceByTraits(
    [profile.personality_tone, profile.personality_style, ...profile.personality_tags],
    profile.gender
  )

  // 4. Generate system prompt
  const systemPrompt = generateSystemPrompt(profile)

  // 5. Save to database
  const coach = await Coach.create({
    name: profile.name,
    tagline: profile.tagline,
    description: `AI-generated ${profile.personality_tone} coach with ${profile.personality_style} style.`,
    specialty: profile.specialty,
    personality: {
      tone: profile.personality_tone,
      style: profile.personality_style,
    },
    personality_tags: profile.personality_tags,
    system_prompt: systemPrompt,
    sample_phrases: [profile.sample_quote],
    voice_id: voice.voice_id,
    avatar_url: avatarUrl,
    pricing: PRICING_TIERS[profile.pricing_tier],
    is_active: true,
    is_generated: true,
    generation_metadata: {
      traits: [profile.personality_tone, profile.personality_style, ...profile.personality_tags],
      image_prompt: imagePrompt,
      voice_mapping_reason: `Matched voice "${voice.name}" (${voice.traits.join(', ')}) to personality (${profile.personality_tone}, ${profile.personality_style})`,
      appearance: profile.appearance,
    },
  })

  return coach
}
