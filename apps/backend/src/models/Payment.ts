import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  session_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
  },
  coach_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true,
  },
  amount_usdc: {
    type: Number,
    required: true,
  },
  session_type: {
    type: String,
    enum: ['quick_5min', 'standard_15min', 'deep_30min'],
    default: 'standard_15min',
  },
  solana_signature: String,
  solana_reference: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  confirmed_at: Date,
})

export const Payment = mongoose.model('Payment', paymentSchema)
