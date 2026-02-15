import { User } from '../models/User.js'
import { Coach } from '../models/Coach.js'

type TraitMap = Record<string, number>

/**
 * Record a swipe (like/dislike) and update the user's trait preferences.
 */
export async function recordSwipe(
  userId: string,
  coachId: string,
  liked: boolean
): Promise<void> {
  const coach = await Coach.findById(coachId).lean()
  if (!coach) return

  const traits = (coach as any).personality_tags as string[] | undefined
  if (!traits?.length) return

  const field = liked ? 'coach_preferences.liked_traits' : 'coach_preferences.disliked_traits'
  const updates: Record<string, number> = {}
  for (const trait of traits) {
    updates[`${field}.${trait}`] = 1
  }

  await User.findByIdAndUpdate(userId, {
    $inc: updates,
    $set: { 'coach_preferences.last_updated': new Date() },
  })
}

/**
 * Get the generation bias for a user based on their swipe history.
 * Returns a trait map where positive = liked, negative = disliked.
 * Returns null if insufficient data (< 5 total swipes).
 */
export async function getGenerationBias(userId: string): Promise<TraitMap | null> {
  const user = await User.findById(userId).lean()
  if (!user) return null

  const prefs = (user as any).coach_preferences
  if (!prefs) return null

  const liked = prefs.liked_traits instanceof Map
    ? Object.fromEntries(prefs.liked_traits)
    : prefs.liked_traits || {}

  const disliked = prefs.disliked_traits instanceof Map
    ? Object.fromEntries(prefs.disliked_traits)
    : prefs.disliked_traits || {}

  const totalSwipes = Object.values(liked).reduce((sum: number, v: any) => sum + v, 0)
    + Object.values(disliked).reduce((sum: number, v: any) => sum + v, 0)

  if (totalSwipes < 5) return null

  // Merge into single score map: liked - disliked
  const bias: TraitMap = {}
  for (const [trait, count] of Object.entries(liked)) {
    bias[trait] = (bias[trait] || 0) + (count as number)
  }
  for (const [trait, count] of Object.entries(disliked)) {
    bias[trait] = (bias[trait] || 0) - (count as number)
  }

  return bias
}
