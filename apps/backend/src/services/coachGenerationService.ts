import { Coach } from '../models/Coach.js'
import { selectVoiceByTraits } from '../config/voicePool.js'
import { buildAvatarUrl, type AppearanceSpec } from '../config/imagePrompts.js'

// ---------------------------------------------------------------------------
// Component pools — combined randomly for ~1M+ unique coaches
// ---------------------------------------------------------------------------

const MALE_NAMES = [
  'Marco', 'Dex', 'Kai', 'Blaze', 'Theo', 'Rio', 'Ash', 'Jax', 'Leo', 'Finn',
  'Niko', 'Soren', 'Dante', 'Rex', 'Cruz',
]

const FEMALE_NAMES = [
  'Luna', 'Mia', 'Zara', 'Nova', 'Sage', 'Ivy', 'Raven', 'Cleo', 'Ruby', 'Willow',
  'Aria', 'Jade', 'Ember', 'Skye', 'Kira',
]

interface PersonalityProfile {
  tone: string
  style: string
  tags: string[]
  quote: string
}

const PERSONALITIES: PersonalityProfile[] = [
  { tone: 'confident', style: 'playful', tags: ['confident', 'smooth', 'witty'], quote: "She glanced twice. That's your green light, go." },
  { tone: 'energetic', style: 'bold', tags: ['hype', 'bold', 'energetic'], quote: "BRO she's literally right there. GO!" },
  { tone: 'calm', style: 'supportive', tags: ['calm', 'supportive', 'gentle'], quote: 'Take a breath. Just be present and listen.' },
  { tone: 'fierce', style: 'direct', tags: ['fierce', 'direct', 'motivational'], quote: 'Stop overthinking. Walk up and say hi. Now.' },
  { tone: 'witty', style: 'serious', tags: ['analytical', 'witty', 'sophisticated'], quote: 'She mentioned travel — ask which country changed her most.' },
  { tone: 'calm', style: 'playful', tags: ['chill', 'playful', 'warm'], quote: 'Easy does it. Compliment something specific, not generic.' },
  { tone: 'gentle', style: 'supportive', tags: ['nerdy', 'empathetic', 'warm'], quote: "You both like that show? Perfect — bond over the finale." },
  { tone: 'bold', style: 'sarcastic', tags: ['bold', 'sarcastic', 'direct'], quote: "Standing there staring won't work. Trust me, I've done the math." },
  { tone: 'confident', style: 'supportive', tags: ['confident', 'warm', 'motivational'], quote: "You've got this. Smile, make eye contact, and just say hey." },
  { tone: 'energetic', style: 'playful', tags: ['playful', 'energetic', 'witty'], quote: "Make her laugh and you're already winning." },
  { tone: 'fierce', style: 'direct', tags: ['fierce', 'bold', 'direct'], quote: "Shoulders back, chin up. You're a catch — act like it." },
  { tone: 'gentle', style: 'nurturing', tags: ['empathetic', 'warm', 'supportive'], quote: "You're doing great. Just be genuine — that's attractive." },
  { tone: 'witty', style: 'sarcastic', tags: ['sarcastic', 'witty', 'direct'], quote: 'Honey, that line was terrible. Try asking about her dog instead.' },
  { tone: 'energetic', style: 'bold', tags: ['motivational', 'bold', 'energetic'], quote: "The universe put you both here. Don't waste the moment!" },
  { tone: 'calm', style: 'serious', tags: ['calm', 'analytical', 'gentle'], quote: "Notice her body language — she's leaning in. Good sign." },
  { tone: 'witty', style: 'playful', tags: ['playful', 'warm', 'witty'], quote: 'Okay that joke landed. Now ask her something real.' },
  { tone: 'bold', style: 'direct', tags: ['bold', 'fierce', 'sophisticated'], quote: "Mystery is attractive. Don't reveal everything at once." },
  { tone: 'confident', style: 'serious', tags: ['sophisticated', 'confident', 'analytical'], quote: "Mirror her energy. She's calm, so match that pace." },
  { tone: 'energetic', style: 'playful', tags: ['hype', 'energetic', 'warm'], quote: 'OMG she smiled at you! Go go go!' },
  { tone: 'gentle', style: 'nurturing', tags: ['gentle', 'empathetic', 'calm'], quote: "There's no rush. Let the silence be comfortable." },
]

const TAGLINES = [
  'Smooth moves only', 'Hype king energy', 'Calm and collected', 'No fear, full send',
  'Strategize and charm', 'Chill vibes always', 'Nerdy charm expert', 'Bold moves pay off',
  'Charming and steady', 'Fun first, always', 'Fierce and fabulous', 'Warm and wise',
  'Sassy truth-teller', 'Cosmic confidence boost', 'Thoughtful and grounded',
  'Playful matchmaker', 'Dark horse energy', 'Queen of conversation', 'Hype girl supreme',
  'Gentle confidence builder', 'Vibes on lock', 'Main character energy', 'Quiet confidence',
  'Zero cringe guaranteed', 'Reads the room perfectly',
]

const HAIR_COLORS = ['black', 'brown', 'blonde', 'red', 'silver', 'pink', 'blue', 'white', 'auburn', 'platinum']
const HAIR_STYLES_M = ['short spiky', 'short', 'curly', 'braided', 'long flowing', 'buzzcut', 'messy']
const HAIR_STYLES_F = ['long flowing', 'curly', 'bob', 'ponytail', 'braided', 'pixie', 'messy bun']
const EYE_COLORS = ['brown', 'blue', 'green', 'amber', 'violet', 'hazel', 'grey', 'teal']
const OUTFIT_COLORS = ['crimson', 'gold', 'teal', 'lavender', 'emerald', 'pink', 'blue', 'silver', 'purple', 'red']

const PRICING_TIERS = {
  budget: { quick_5min: 0.5, standard_15min: 1.5, deep_30min: 3.0 },
  standard: { quick_5min: 1.0, standard_15min: 3.0, deep_30min: 5.0 },
  premium: { quick_5min: 2.0, standard_15min: 5.0, deep_30min: 8.0 },
}

// Weighted: 30% budget, 50% standard, 20% premium
const PRICING_WEIGHTS: Array<'budget' | 'standard' | 'premium'> = [
  'budget', 'budget', 'budget',
  'standard', 'standard', 'standard', 'standard', 'standard',
  'premium', 'premium',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface CoachTemplate {
  name: string
  gender: 'male' | 'female'
  tagline: string
  personality_tags: string[]
  personality_tone: string
  personality_style: string
  sample_quote: string
  appearance: AppearanceSpec
  pricing_tier: 'budget' | 'standard' | 'premium'
}

function generateSystemPrompt(template: CoachTemplate): string {
  return `You are ${template.name}, a ${template.personality_tone} and ${template.personality_style} AI dating coach speaking live into the user's ear through their earpiece.

PERSONALITY:
- ${template.personality_tags.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
- Tone: ${template.personality_tone}
- Style: ${template.personality_style}
- Your tagline: "${template.tagline}"

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

// ---------------------------------------------------------------------------
// Main generator — combinatorial, instant, no AI
// ---------------------------------------------------------------------------

/**
 * Create a coach by randomly combining pools of names, personalities,
 * appearances, taglines, and pricing tiers.
 * ~1M+ unique combinations. No AI APIs — instant, can't fail.
 */
export async function createGeneratedCoach() {
  const gender: 'male' | 'female' = pickRandom(['male', 'female'])
  const name = pickRandom(gender === 'male' ? MALE_NAMES : FEMALE_NAMES)
  const personality = pickRandom(PERSONALITIES)
  const tagline = pickRandom(TAGLINES)
  const pricingTier = pickRandom(PRICING_WEIGHTS)

  const appearance: AppearanceSpec = {
    hair_color: pickRandom(HAIR_COLORS),
    hair_style: pickRandom(gender === 'male' ? HAIR_STYLES_M : HAIR_STYLES_F),
    eye_color: pickRandom(EYE_COLORS),
    outfit_color: pickRandom(OUTFIT_COLORS),
    gender,
  }

  const template: CoachTemplate = {
    name,
    gender,
    tagline,
    personality_tags: personality.tags,
    personality_tone: personality.tone,
    personality_style: personality.style,
    sample_quote: personality.quote,
    appearance,
    pricing_tier: pricingTier,
  }

  const avatarUrl = buildAvatarUrl(name, appearance)

  const voice = selectVoiceByTraits(
    [personality.tone, personality.style, ...personality.tags],
    gender
  )

  const systemPrompt = generateSystemPrompt(template)

  const coach = await Coach.create({
    name,
    tagline,
    description: `${personality.tone.charAt(0).toUpperCase() + personality.tone.slice(1)} coach with ${personality.style} style.`,
    specialty: 'dating',
    personality: {
      tone: personality.tone,
      style: personality.style,
    },
    personality_tags: personality.tags,
    system_prompt: systemPrompt,
    sample_phrases: [personality.quote],
    voice_id: voice.voice_id,
    avatar_url: avatarUrl,
    pricing: PRICING_TIERS[pricingTier],
    is_active: true,
    is_generated: true,
    generation_metadata: {
      traits: [personality.tone, personality.style, ...personality.tags],
      voice_mapping_reason: `Matched voice "${voice.name}" (${voice.traits.join(', ')}) to personality (${personality.tone}, ${personality.style})`,
      appearance,
    },
  })

  return coach
}
