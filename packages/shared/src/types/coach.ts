export interface CoachPricing {
  quick_5min: number
  standard_15min: number
  deep_30min: number
}

export interface CoachGenerationMetadata {
  traits: string[]
  image_prompt: string
  voice_mapping_reason: string
  appearance: {
    hair_color: string
    hair_style: string
    eye_color: string
    outfit_color: string
    gender: string
  }
}

export interface Coach {
  _id: string
  name: string
  tagline: string
  description?: string
  specialty: CoachSpecialty
  personality: { tone: string; style: string }
  personality_tags: string[]
  system_prompt: string
  sample_phrases: string[]
  voice_id?: string
  avatar_url?: string
  avatar_emoji?: string
  color_from?: string
  color_to?: string
  pricing: CoachPricing
  rating: number
  session_count: number
  is_active: boolean
  is_premium: boolean
  is_human: boolean
  is_generated: boolean
  generation_metadata?: CoachGenerationMetadata
  created_at: Date
}

export interface RosterEntry {
  coach_id: Coach
  added_at: Date
  is_default: boolean
}

export interface UserRoster {
  roster: RosterEntry[]
  limit: number
}

export type CoachSpecialty = 'dating' | 'interview' | 'sales' | 'public-speaking' | 'general'
