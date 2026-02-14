import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: String,
  picture: String, // Profile picture URL
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
