import mongoose from 'mongoose'

export async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shoulder-cupid'
    await mongoose.connect(mongoUri)
    console.log('✓ MongoDB connected')
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error)
    process.exit(1)
  }
}
