export interface Coach {
  _id: string
  name: string
  description?: string
  specialty: 'dating' | 'interview' | 'sales' | 'public-speaking' | 'general'
  system_prompt: string
  voice_id?: string // ElevenLabs voice ID
  avatar_url?: string
  rating: number
  is_active: boolean
  is_human: boolean
  created_by?: string
  created_at: Date
}

export type CoachSpecialty = Coach['specialty']
