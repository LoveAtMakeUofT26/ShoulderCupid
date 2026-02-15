import mongoose from 'mongoose'

const coachSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  tagline: String,
  description: String,
  specialty: {
    type: String,
    enum: ['dating', 'interview', 'sales', 'public-speaking', 'general'],
    default: 'dating',
  },
  personality: {
    tone: String,
    style: String,
  },
  personality_tags: {
    type: [String],
    default: [],
  },
  system_prompt: {
    type: String,
    required: true,
  },
  sample_phrases: [String],
  voice_id: String,
  avatar_url: String,
  avatar_emoji: String, // Legacy - used by seeded coaches
  color_from: String, // Legacy
  color_to: String, // Legacy
  pricing: {
    quick_5min: { type: Number, default: 1.0 },
    standard_15min: { type: Number, default: 3.0 },
    deep_30min: { type: Number, default: 5.0 },
  },
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
  is_generated: {
    type: Boolean,
    default: false,
  },
  generation_metadata: {
    traits: [String],
    image_prompt: String,
    voice_mapping_reason: String,
    appearance: {
      hair_color: String,
      hair_style: String,
      eye_color: String,
      outfit_color: String,
      gender: String,
    },
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
})

export const Coach = mongoose.model('Coach', coachSchema)
