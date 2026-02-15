export interface VoiceEntry {
  voice_id: string
  name: string
  gender: 'male' | 'female' | 'neutral'
  traits: string[]
}

export const VOICE_POOL: VoiceEntry[] = [
  // Male voices
  { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'male', traits: ['confident', 'smooth', 'deep'] },
  { voice_id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', gender: 'male', traits: ['energetic', 'bold', 'commanding'] },
  { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', gender: 'male', traits: ['warm', 'friendly', 'gentle'] },
  { voice_id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', gender: 'male', traits: ['casual', 'chill', 'relatable'] },
  { voice_id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', gender: 'male', traits: ['calm', 'thoughtful', 'articulate'] },
  { voice_id: 'ZQe5CZNOzWyzPSCn5a3c', name: 'James', gender: 'male', traits: ['authoritative', 'professional', 'direct'] },
  { voice_id: 'bVMeCyTHy58xNoL34h3p', name: 'Jeremy', gender: 'male', traits: ['witty', 'playful', 'charming'] },
  { voice_id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', gender: 'male', traits: ['supportive', 'encouraging', 'steady'] },
  { voice_id: 'N2lVS1w4EoAxEBqZHePp', name: 'Callum', gender: 'male', traits: ['adventurous', 'bold', 'spirited'] },
  { voice_id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', gender: 'male', traits: ['youthful', 'upbeat', 'enthusiastic'] },
  { voice_id: 'SOYHLrjzK2X1ezoPC6cr', name: 'Harry', gender: 'male', traits: ['warm', 'reassuring', 'honest'] },
  { voice_id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', gender: 'male', traits: ['cool', 'laid-back', 'easygoing'] },
  { voice_id: 'GBv7mTt0atIp3Br8iCZE', name: 'Thomas', gender: 'male', traits: ['analytical', 'precise', 'methodical'] },
  { voice_id: 'ODq5zmih8GrVes37Dizd', name: 'Patrick', gender: 'male', traits: ['motivational', 'intense', 'driven'] },
  { voice_id: 'g5CIjZEefAph4nQFvHAz', name: 'Ethan', gender: 'male', traits: ['nerdy', 'clever', 'quirky'] },

  // Female voices
  { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', gender: 'female', traits: ['calm', 'soothing', 'empathetic'] },
  { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'female', traits: ['confident', 'polished', 'articulate'] },
  { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', gender: 'female', traits: ['bold', 'fierce', 'direct'] },
  { voice_id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', gender: 'female', traits: ['cheerful', 'bubbly', 'energetic'] },
  { voice_id: 'jBpfuIE2acCO8z3wKNLl', name: 'Gigi', gender: 'female', traits: ['playful', 'flirty', 'fun'] },
  { voice_id: 'oWAxZDx7w5VEj9dCyTzz', name: 'Grace', gender: 'female', traits: ['elegant', 'poised', 'wise'] },
  { voice_id: 'z9fAnlkpzviPz146aGWa', name: 'Glinda', gender: 'female', traits: ['warm', 'motherly', 'nurturing'] },
  { voice_id: 'jsCqWAovK2LkecY7zXl4', name: 'Freya', gender: 'female', traits: ['adventurous', 'spirited', 'bold'] },
  { voice_id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', gender: 'female', traits: ['sophisticated', 'witty', 'sharp'] },
  { voice_id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', gender: 'female', traits: ['gentle', 'sweet', 'supportive'] },
  { voice_id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', gender: 'female', traits: ['calm', 'thoughtful', 'steady'] },
  { voice_id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy', gender: 'female', traits: ['enthusiastic', 'motivational', 'uplifting'] },
  { voice_id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', gender: 'female', traits: ['casual', 'relatable', 'easygoing'] },
  { voice_id: 'cgSgspJ2msm6clMCkdEu', name: 'Jessica', gender: 'female', traits: ['professional', 'analytical', 'precise'] },
  { voice_id: 'iP95p4xoKVk53GoZ742B', name: 'Chris', gender: 'neutral', traits: ['balanced', 'neutral', 'versatile'] },
]

/**
 * Select a voice that best matches the given personality traits.
 * Adds randomness to avoid always picking the same voice for similar traits.
 */
export function selectVoiceByTraits(traits: string[], preferredGender?: string): VoiceEntry {
  const candidates = preferredGender
    ? VOICE_POOL.filter(v => v.gender === preferredGender || v.gender === 'neutral')
    : VOICE_POOL

  const scored = candidates.map(voice => {
    const matchCount = voice.traits.filter(t => traits.includes(t)).length
    // Add small random factor to break ties and add variety
    const randomBonus = Math.random() * 0.5
    return { voice, score: matchCount + randomBonus }
  })

  scored.sort((a, b) => b.score - a.score)

  // Pick from top 3 candidates randomly for variety
  const topCandidates = scored.slice(0, Math.min(3, scored.length))
  const pick = topCandidates[Math.floor(Math.random() * topCandidates.length)]

  return pick.voice
}
