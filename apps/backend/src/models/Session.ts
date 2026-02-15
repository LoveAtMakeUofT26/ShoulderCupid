import mongoose from 'mongoose'

export type SessionStatus = 'active' | 'ended' | 'cancelled'
export type SessionMode = 'IDLE' | 'APPROACH' | 'CONVERSATION'

const sessionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  test_session: {
    type: Boolean,
    default: false,
  },
  coach_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'ended', 'cancelled'],
    default: 'active',
  },
  mode: {
    type: String,
    enum: ['IDLE', 'APPROACH', 'CONVERSATION'],
    default: 'IDLE',
  },
  started_at: {
    type: Date,
    default: Date.now,
  },
  ended_at: Date,
  duration_seconds: Number,
  transcript: [{
    timestamp: { type: Date, default: Date.now },
    speaker: {
      type: String,
      enum: ['user', 'target', 'coach'],
    },
    text: String,
    emotion: String,
  }],
  emotions: [{
    timestamp: { type: Date, default: Date.now },
    emotion: String,
    confidence: Number,
    target_heart_rate: Number,
    target_hrv: Number,
    target_breathing_rate: Number,
    target_blinking: Boolean,
    target_talking: Boolean,
  }],
  analytics: {
    total_tips: { type: Number, default: 0 },
    approach_count: { type: Number, default: 0 },
    conversation_count: { type: Number, default: 0 },
    avg_emotion_score: Number,
    warnings_triggered: { type: Number, default: 0 },
  },
  report: {
    summary: String,
    highlights: [String],
    improvements: [String],
    generated_at: Date,
  },
  credits_used: {
    type: Number,
    default: 0,
  },
})

export const Session = mongoose.model('Session', sessionSchema)
