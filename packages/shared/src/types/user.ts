export interface User {
  _id: string
  email: string
  name?: string
  picture?: string
  oauth_provider: 'google' | 'discord'
  oauth_id: string
  tier: 'free' | 'premium'
  credits: number
  devices: Device[]
  created_at: Date
}

export interface Device {
  device_id: string
  paired_at: Date
}

export interface CoachPreferences {
  liked_traits: Record<string, number>
  disliked_traits: Record<string, number>
  last_updated?: Date
}
