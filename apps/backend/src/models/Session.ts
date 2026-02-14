import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  coach_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true,
  },
  started_at: {
    type: Date,
    default: Date.now,
  },
  ended_at: Date,
  transcript: [{
    timestamp: Date,
    speaker: {
      type: String,
      enum: ['user', 'coach'],
    },
    text: String,
  }],
  analytics: {
    total_tips: {
      type: Number,
      default: 0,
    },
    sentiment_score: Number,
  },
  credits_used: {
    type: Number,
    default: 0,
  },
})

export const Session = mongoose.model('Session', sessionSchema)
