import mongoose from 'mongoose'

const coachSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  tagline: String, // Short personality description
  description: String, // Longer description
  specialty: {
    type: String,
    enum: ['dating', 'interview', 'sales', 'public-speaking', 'general'],
    default: 'dating',
  },
  personality: {
    tone: String, // e.g., "confident", "calm", "energetic"
    style: String, // e.g., "playful", "serious", "supportive"
  },
  system_prompt: {
    type: String,
    required: true,
  },
  sample_phrases: [String], // Example things this coach might say
  voice_id: String, // ElevenLabs voice ID
  avatar_url: String,
  avatar_emoji: String, // Fallback emoji for avatar
  color_from: String, // Gradient start color (hex)
  color_to: String, // Gradient end color (hex)
  rating: {
    type: Number,
    default: 0,
  },
  session_count: {
    type: Number,
    default: 0,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  is_premium: {
    type: Boolean,
    default: false,
  },
  is_human: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
})

export const Coach = mongoose.model('Coach', coachSchema)
