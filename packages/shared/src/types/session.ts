export interface Session {
  _id: string
  user_id: string
  coach_id: string
  started_at: Date
  ended_at?: Date
  transcript: TranscriptEntry[]
  analytics: SessionAnalytics
  credits_used: number
}

export interface TranscriptEntry {
  timestamp: Date
  speaker: 'user' | 'coach'
  text: string
}

export interface SessionAnalytics {
  total_tips: number
  sentiment_score?: number
}
