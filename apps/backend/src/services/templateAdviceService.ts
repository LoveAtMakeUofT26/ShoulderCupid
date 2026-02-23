// Template-based advice hints — replaces OpenAI/Gemini advice.
// No external API calls. Short 1-5 word hints cycled through pools.

export interface TranscriptEntry {
  id: string
  timestamp: number
  speaker: 'user' | 'target' | 'coach'
  text: string
  emotion?: string
}

// Advice pools by category — each hint is 1-5 words or one short sentence
const ADVICE_POOLS = {
  bodyLanguage: [
    'Lean in slightly',
    'Open posture',
    'Uncross your arms',
    'Relax your hands',
    'Mirror their stance',
    'Nod along',
    'Face them directly',
  ],
  eyeContact: [
    'Make eye contact',
    'Look, then glance away',
    'Soft eye contact',
    'Hold their gaze briefly',
    'Don\'t stare — glance naturally',
  ],
  energy: [
    'Match their energy',
    'Bring the enthusiasm up',
    'Calm and confident',
    'Stay present',
    'You\'re in the zone',
    'Keep this vibe going',
    'Easy, natural flow',
  ],
  questions: [
    'Ask about them',
    'Open-ended question time',
    'Go deeper on that topic',
    'Ask what they love',
    'Curious, not interrogating',
    'Follow up on that',
  ],
  compliments: [
    'Drop a genuine compliment',
    'Acknowledge what they said',
    'That\'s your opening',
    'Nice connection point',
  ],
  pacing: [
    'Slow down a bit',
    'Let them talk more',
    'Pause before responding',
    'Don\'t rush',
    'Breathe',
    'Silence is fine',
  ],
  encouragement: [
    'You\'re doing great',
    'Keep it up',
    'Nice move',
    'Good energy',
    'They\'re into it',
    'Stay confident',
    'This is going well',
    'Natural chemistry here',
  ],
  topics: [
    'Switch to something fun',
    'Ask about their weekend',
    'Share a quick story',
    'Talk about shared interests',
    'Change the subject gently',
    'Ask what excites them',
  ],
}

const ALL_CATEGORIES = Object.keys(ADVICE_POOLS) as (keyof typeof ADVICE_POOLS)[]

interface AdviceSession {
  lastCategoryIndex: number
  usedInSession: Set<string>
}

const activeSessions = new Map<string, AdviceSession>()

export function initAdviceSession(sessionId: string): void {
  activeSessions.delete(sessionId)
  activeSessions.set(sessionId, {
    lastCategoryIndex: 0,
    usedInSession: new Set(),
  })
  console.log(`Template advice session initialized for ${sessionId}`)
}

export async function getAdvice(
  sessionId: string,
  transcript: TranscriptEntry[],
  recentAdvice: string[] = []
): Promise<string> {
  if (!transcript.length) {
    return 'Listen, then share a bit about yourself.'
  }

  const session = activeSessions.get(sessionId)
  if (!session) {
    return 'Stay confident.'
  }

  const recentSet = new Set(recentAdvice.map(a => a.toLowerCase()))

  // Rotate through categories to ensure variety
  for (let attempts = 0; attempts < ALL_CATEGORIES.length * 2; attempts++) {
    const catIdx = (session.lastCategoryIndex + attempts) % ALL_CATEGORIES.length
    const category = ALL_CATEGORIES[catIdx]!
    const pool = ADVICE_POOLS[category]

    // Pick a random hint from this category
    const hint = pool[Math.floor(Math.random() * pool.length)]!

    // Skip if recently used
    if (recentSet.has(hint.toLowerCase())) continue
    if (session.usedInSession.has(hint)) continue

    session.lastCategoryIndex = (catIdx + 1) % ALL_CATEGORIES.length
    session.usedInSession.add(hint)

    // Reset used set after we've gone through most hints
    if (session.usedInSession.size > 30) {
      session.usedInSession.clear()
    }

    return hint
  }

  // Fallback if somehow all hints were recently used
  return 'Keep the conversation flowing.'
}

export function endAdviceSession(sessionId: string): void {
  activeSessions.delete(sessionId)
  console.log(`Advice session ended: ${sessionId}`)
}
