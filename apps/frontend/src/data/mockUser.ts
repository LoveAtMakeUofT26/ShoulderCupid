// Mock user for demo mode
import { coaches, type Coach } from './coaches'

export interface MockUser {
  id: string
  email: string
  name: string
  picture: string | null
  coach: Coach | null
  preferences: {
    target_gender: string
    comfort_sensitivity: string
    coaching_style: string
  }
  onboarding_completed: boolean
  credits: number
}

// Selected coach ID stored in localStorage
const SELECTED_COACH_KEY = 'cupid_selected_coach'

export function getSelectedCoachId(): string {
  return localStorage.getItem(SELECTED_COACH_KEY) || coaches[0]._id
}

export function setSelectedCoachId(id: string): void {
  localStorage.setItem(SELECTED_COACH_KEY, id)
}

export function getMockUser(): MockUser {
  const coachId = getSelectedCoachId()
  const coach = coaches.find(c => c._id === coachId) || coaches[0]

  return {
    id: 'demo-user-123',
    email: 'demo@shouldercupid.com',
    name: 'Demo User',
    picture: null,
    coach,
    preferences: {
      target_gender: 'everyone',
      comfort_sensitivity: 'medium',
      coaching_style: 'balanced',
    },
    onboarding_completed: true,
    credits: 100,
  }
}
