import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: String,
  picture: String, // Profile picture URL
  age: Number,
  pronouns: {
    type: String,
    enum: ['he/him', 'she/her', 'they/them', 'other'],
  },
  oauth_provider: {
    type: String,
    required: true,
    enum: ['google', 'discord'],
  },
  oauth_id: {
    type: String,
    required: true,
  },
  coach_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
  },
  coach_roster: [{
    coach_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coach',
      required: true,
    },
    added_at: { type: Date, default: Date.now },
    is_default: { type: Boolean, default: false },
  }],
  coach_preferences: {
    liked_traits: { type: Map, of: Number, default: new Map() },
    disliked_traits: { type: Map, of: Number, default: new Map() },
    last_updated: Date,
  },
  tier: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free',
  },
  preferences: {
    target_gender: {
      type: String,
      enum: ['men', 'women', 'everyone'],
      default: 'everyone',
    },
    comfort_sensitivity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    coaching_style: {
      type: String,
      enum: ['aggressive', 'balanced', 'gentle'],
      default: 'balanced',
    },
  },
  quiz_results: {
    confidence_level: String,
    biggest_challenge: String,
    directness_preference: String,
    goals: String,
    recommended_coach_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coach',
    },
  },
  onboarding_completed: {
    type: Boolean,
    default: false,
  },
  credits: {
    type: Number,
    default: 100,
  },
  devices: [{
    device_id: String,
    paired_at: Date,
  }],
  created_at: {
    type: Date,
    default: Date.now,
  },
})

export const User = mongoose.model('User', userSchema)
