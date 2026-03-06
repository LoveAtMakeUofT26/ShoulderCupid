// Mock past sessions for the Sessions page
import { coaches } from './coaches'

export interface MockSession {
  _id: string
  coach: typeof coaches[0]
  status: 'ended'
  mode: string
  started_at: string
  ended_at: string
  duration_seconds: number
  title: string
  score: number
  analytics: {
    total_tips: number
    approach_count: number
    conversation_count: number
    warnings_triggered: number
  }
  report: {
    summary: string
    highlights: string[]
    improvements: string[]
  }
}

// Generate a date from X hours ago
function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

export const mockSessions: MockSession[] = [
  {
    _id: 'session-1',
    coach: coaches[0], // Smooth Operator
    status: 'ended',
    mode: 'CONVERSATION',
    started_at: hoursAgo(2),
    ended_at: hoursAgo(1.9),
    duration_seconds: 342,
    title: 'Coffee Shop Approach',
    score: 8,
    analytics: {
      total_tips: 12,
      approach_count: 1,
      conversation_count: 1,
      warnings_triggered: 0,
    },
    report: {
      summary: 'Great session! You approached confidently and maintained good conversation flow.',
      highlights: [
        'Smooth approach with good eye contact',
        'Great follow-up questions',
        'Natural conversation ending',
      ],
      improvements: [
        'Could have asked for contact info',
        'Try to smile more naturally',
      ],
    },
  },
  {
    _id: 'session-2',
    coach: coaches[1], // Wingman Chad
    status: 'ended',
    mode: 'APPROACH',
    started_at: hoursAgo(26),
    ended_at: hoursAgo(25.8),
    duration_seconds: 180,
    title: 'Bar Introduction',
    score: 7,
    analytics: {
      total_tips: 8,
      approach_count: 2,
      conversation_count: 1,
      warnings_triggered: 1,
    },
    report: {
      summary: 'Good energy! The approach was confident. Got a warning for standing too close initially.',
      highlights: [
        'High confidence on approach',
        'Good recovery after awkward moment',
      ],
      improvements: [
        'Watch personal space',
        'Slow down a bit',
      ],
    },
  },
  {
    _id: 'session-3',
    coach: coaches[2], // Gentle Guide
    status: 'ended',
    mode: 'CONVERSATION',
    started_at: hoursAgo(72),
    ended_at: hoursAgo(71.8),
    duration_seconds: 480,
    title: 'Bookstore Chat',
    score: 9,
    analytics: {
      total_tips: 15,
      approach_count: 1,
      conversation_count: 1,
      warnings_triggered: 0,
    },
    report: {
      summary: 'Beautiful authentic connection. You were present and genuine throughout.',
      highlights: [
        'Deep, meaningful conversation',
        'Great active listening',
        'Exchanged numbers naturally',
      ],
      improvements: [
        'Could have been a bit more playful',
      ],
    },
  },
]

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  const days = Math.floor(diffHours / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}
