const API_BASE_URL = '/api';

export interface Coach {
  _id: string
  name: string
  tagline: string
  description: string
  personality: string
  avatar_emoji: string
  color_from: string
  color_to: string
  sample_phrases: string[]
  rating: number
  session_count: number
}

export interface User {
  id: string
  email: string
  name: string | null
  picture: string | null
  age?: number
  pronouns?: string
  coach: Coach | null
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
