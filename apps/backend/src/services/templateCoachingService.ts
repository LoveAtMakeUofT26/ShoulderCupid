// Template-based coaching responses — replaces Gemini AI coaching.
// No external API calls. Responses are matched to mode + keywords.

interface CoachingContext {
  mode: string
  coachName: string
}

const activeSessions = new Map<string, CoachingContext>()

// Response pools by mode
const IDLE_RESPONSES = [
  'Look around — who catches your eye?',
  'Stay relaxed. Good energy attracts people.',
  'Take a breath. No rush.',
  'Scan the room — spot anyone interesting?',
  'Confidence starts with how you carry yourself.',
  'Relax your shoulders. You got this.',
  'Make yourself approachable — open posture, easy smile.',
  'Great vibes. Let things happen naturally.',
]

const APPROACH_RESPONSES = [
  'Walk over with confidence. Smile first.',
  'Start simple — comment on something around you.',
  'Make eye contact, then approach.',
  'Keep it casual. Just say hi.',
  'Don\'t overthink it. Walk up and introduce yourself.',
  'Open with something genuine, not a line.',
  'Match their energy as you approach.',
  'Slow your pace. Confidence is calm.',
]

const CONVERSATION_RESPONSES: Array<{ keywords: string[]; responses: string[] }> = [
  {
    keywords: ['name', 'call', 'who'],
    responses: [
      'Nice! Remember their name — use it naturally.',
      'Good, you know their name now. Build on that.',
    ],
  },
  {
    keywords: ['work', 'job', 'career', 'office', 'company'],
    responses: [
      'Ask a follow-up about what they enjoy about it.',
      'Share something about yours too — keep it balanced.',
      'That\'s a good topic. Go deeper, not wider.',
    ],
  },
  {
    keywords: ['funny', 'laugh', 'haha', 'lol', 'joke'],
    responses: [
      'They\'re laughing — great sign. Keep that energy.',
      'Nice humor! Don\'t force the next joke though.',
      'Good chemistry here. Stay natural.',
    ],
  },
  {
    keywords: ['like', 'love', 'enjoy', 'favorite', 'fun'],
    responses: [
      'You found common ground. Build on it!',
      'Ask them to tell you more about that.',
      'Share your take on it too.',
    ],
  },
  {
    keywords: ['nervous', 'awkward', 'sorry', 'um', 'uh'],
    responses: [
      'Relax — you\'re doing fine. Breathe.',
      'A pause is natural. Don\'t fill every silence.',
      'Slow down. You\'re in no rush.',
    ],
  },
  {
    keywords: ['number', 'phone', 'text', 'contact', 'instagram', 'snap'],
    responses: [
      'Good move asking. Be direct about it.',
      'Nice! Don\'t linger after you get it — leave on a high note.',
    ],
  },
  {
    keywords: ['drink', 'food', 'eat', 'hungry', 'coffee', 'bar'],
    responses: [
      'Suggesting something together? Smooth move.',
      'Food and drink talk is always easy. Keep it flowing.',
    ],
  },
  {
    keywords: ['music', 'song', 'band', 'concert', 'playlist'],
    responses: [
      'Music taste says a lot. Ask what they\'re into.',
      'If you share taste — that\'s a connection point.',
    ],
  },
  {
    keywords: ['weekend', 'plans', 'tonight', 'tomorrow', 'free'],
    responses: [
      'They\'re open to plans? This could be your in.',
      'If they mention being free, suggest something casual.',
    ],
  },
]

const GENERIC_CONVERSATION = [
  'Ask an open-ended question — get them talking.',
  'Listen more than you speak right now.',
  'Mirror their energy. Match their vibe.',
  'Good eye contact. Not too intense though.',
  'Share something personal — build trust.',
  'Ask about their passions — people light up.',
  'Keep it playful. Don\'t interview them.',
  'Lean in slightly — show you\'re engaged.',
  'That\'s interesting — ask them to elaborate.',
  'Good rhythm. Keep the back-and-forth going.',
  'Add a genuine compliment, not about looks.',
  'Share a quick story related to what they said.',
  'Let them finish before responding.',
  'Nod and react — show you\'re listening.',
  'Find what excites them and go deeper there.',
]

let responseIndex = new Map<string, number>()

function getNextResponse(sessionId: string, pool: string[]): string {
  const key = `${sessionId}:${pool.length}`
  const idx = responseIndex.get(key) || 0
  responseIndex.set(key, (idx + 1) % pool.length)
  return pool[idx]!
}

function findKeywordMatch(text: string): string[] | null {
  const lower = text.toLowerCase()
  for (const group of CONVERSATION_RESPONSES) {
    if (group.keywords.some(kw => lower.includes(kw))) {
      return group.responses
    }
  }
  return null
}

export async function initCoachingSession(
  sessionId: string,
  _systemPrompt: string,
  mode: string,
  coachName: string
): Promise<void> {
  activeSessions.delete(sessionId)
  activeSessions.set(sessionId, { mode, coachName })
  console.log(`Template coaching initialized: ${coachName} for session ${sessionId} in ${mode} mode`)
}

export async function getCoachingResponse(
  sessionId: string,
  text: string,
  context: { mode: string; emotion?: string; distance?: number }
): Promise<string> {
  const session = activeSessions.get(sessionId)
  if (!session) throw new Error(`No active coaching session for ${sessionId}`)

  // Small random delay to feel natural (200-800ms)
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 600))

  let pool: string[]

  if (context.mode === 'IDLE') {
    pool = IDLE_RESPONSES
  } else if (context.mode === 'APPROACH') {
    pool = APPROACH_RESPONSES
  } else {
    // CONVERSATION — try keyword matching first
    const matched = findKeywordMatch(text)
    pool = matched || GENERIC_CONVERSATION
  }

  const response = getNextResponse(sessionId, pool)
  console.log(`Coach ${session.coachName}: "${response}"`)
  return response
}

export function updateCoachingMode(sessionId: string, newMode: string): void {
  const session = activeSessions.get(sessionId)
  if (!session) return
  session.mode = newMode
  console.log(`Coaching mode updated to ${newMode} for session ${sessionId}`)
}

export function endCoachingSession(sessionId: string): void {
  activeSessions.delete(sessionId)
  // Clean up response indices for this session
  for (const key of responseIndex.keys()) {
    if (key.startsWith(sessionId)) {
      responseIndex.delete(key)
    }
  }
  console.log(`Coaching session ended: ${sessionId}`)
}
