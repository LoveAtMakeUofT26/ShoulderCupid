import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { connectDB } from '../config/database.js'
import { User } from '../models/User.js'
import { Coach } from '../models/Coach.js'

dotenv.config()

async function migrate() {
  try {
    await connectDB()
    console.log('Starting roster migration...\n')

    // 1. Update existing coaches with new fields
    const coachResult = await Coach.updateMany(
      { is_generated: { $exists: false } },
      {
        $set: {
          is_generated: false,
          pricing: { quick_5min: 1.0, standard_15min: 3.0, deep_30min: 5.0 },
          personality_tags: [],
        },
      }
    )
    console.log(`Updated ${coachResult.modifiedCount} coaches with new fields`)

    // Set personality_tags for existing seeded coaches
    await Coach.updateOne(
      { name: 'Smooth Operator' },
      { $set: { personality_tags: ['confident', 'playful', 'smooth'] } }
    )
    await Coach.updateOne(
      { name: 'Wingman Chad' },
      { $set: { personality_tags: ['hype', 'bold', 'energetic'] } }
    )
    await Coach.updateOne(
      { name: 'Gentle Guide' },
      { $set: { personality_tags: ['calm', 'supportive', 'gentle'] } }
    )
    console.log('Set personality tags for seeded coaches')

    // 2. Migrate users with coach_id to roster
    const users = await User.find({
      coach_id: { $exists: true, $ne: null },
      'coach_roster.0': { $exists: false }, // Only users without roster
    })

    let migrated = 0
    for (const user of users) {
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            coach_roster: [{
              coach_id: (user as any).coach_id,
              added_at: new Date(),
              is_default: true,
            }],
            coach_preferences: {
              liked_traits: {},
              disliked_traits: {},
              last_updated: new Date(),
            },
            tier: 'free',
          },
        }
      )
      migrated++
    }
    console.log(`Migrated ${migrated} users to roster system`)

    // 3. Set tier=free for users without tier
    const tierResult = await User.updateMany(
      { tier: { $exists: false } },
      { $set: { tier: 'free' } }
    )
    console.log(`Set tier=free for ${tierResult.modifiedCount} users`)

    console.log('\nMigration complete!')
  } catch (error) {
    console.error('Migration error:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

migrate()
