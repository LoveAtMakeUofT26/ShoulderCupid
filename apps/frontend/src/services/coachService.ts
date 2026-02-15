import type { Coach, RosterEntry } from './auth'

const API_BASE = '/api'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...options })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

/** Generate a new AI coach (calls backend Gemini + Pollinations pipeline). */
export async function generateCoach(): Promise<Coach> {
  const data = await fetchJson<{ coach: Coach }>(`${API_BASE}/coaches/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ useBias: true }),
  })
  return data.coach
}

/** Get a voice preview for a coach (returns base64 mp3). */
export async function getVoicePreview(
  coachId: string,
  text?: string
): Promise<string> {
  const data = await fetchJson<{ audio: string }>(`${API_BASE}/coaches/${coachId}/voice-preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  return data.audio
}

/** Fetch the user's coach roster. */
export async function getRoster(): Promise<{ roster: RosterEntry[]; limit: number }> {
  return fetchJson(`${API_BASE}/user/roster`)
}

/** Add a coach to the user's roster. */
export async function addToRoster(coachId: string): Promise<{ roster: RosterEntry[] }> {
  return fetchJson(`${API_BASE}/user/roster`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coachId }),
  })
}

/** Remove a coach from the user's roster. */
export async function removeFromRoster(coachId: string): Promise<{ roster: RosterEntry[] }> {
  return fetchJson(`${API_BASE}/user/roster/${coachId}`, {
    method: 'DELETE',
  })
}

/** Set a coach as the default in the roster. */
export async function setDefaultCoach(coachId: string): Promise<void> {
  await fetchJson(`${API_BASE}/user/roster/${coachId}/default`, {
    method: 'PATCH',
  })
}

/** Record a swipe for the preference algorithm. */
export async function recordSwipe(coachId: string, liked: boolean): Promise<void> {
  await fetchJson(`${API_BASE}/user/swipe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coachId, liked }),
  })
}
