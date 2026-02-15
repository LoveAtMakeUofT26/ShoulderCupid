const API_BASE_URL = '/api';

export interface CoachPricing {
  quick_5min: number
  standard_15min: number
  deep_30min: number
}

export interface Coach {
  _id: string
  name: string
  tagline: string
  description?: string
  specialty: string
  personality: { tone: string; style: string }
  personality_tags: string[]
  sample_phrases: string[]
  voice_id?: string
  avatar_url?: string
  avatar_emoji?: string
  color_from?: string
  color_to?: string
  pricing: CoachPricing
  rating: number
  session_count: number
  is_generated: boolean
}

export interface RosterEntry {
  coach_id: Coach
  added_at: string
  is_default: boolean
}

export interface User {
  id: string
  email: string
  name: string | null
  picture: string | null
  age?: number
  pronouns?: string
  coach: Coach | null
  roster: RosterEntry[]
  rosterLimit: number
  tier: 'free' | 'premium'
  preferences: {
    target_gender: string
    comfort_sensitivity: string
    coaching_style: string
  }
  onboarding_completed: boolean
  credits: number
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error('Failed to fetch user');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to logout');
    }
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
}
