import { GoogleGenerativeAI, type ChatSession } from '@google/generative-ai'
import { loadEnv } from '../config/loadEnv.js'
import { retryWithBackoff } from '../utils/resilience.js'

loadEnv()

// Must match the env var used elsewhere (gemini.ts uses GOOGLE_AI_API_KEY)
const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || ''
if (!apiKey) {
  console.warn('WARNING: No Gemini API key found. Set GOOGLE_AI_API_KEY in your environment.')
}
const genAI = new GoogleGenerativeAI(apiKey)

interface CoachingContext {
  chat: ChatSession
  mode: string
  coachName: string
}

// Active coaching sessions keyed by sessionId
const activeSessions = new Map<string, CoachingContext>()

export async function initCoachingSession(
  sessionId: string,
  systemPrompt: string,
  mode: string,
  coachName: string
): Promise<void> {
  // Clean up existing session if any
  activeSessions.delete(sessionId)

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    systemInstruction: `${systemPrompt}\n\nCURRENT MODE: ${mode}\nYou are whispering into the user's ear via an earpiece. Keep responses to 1-2 sentences maximum. Be specific and actionable.`,
    generationConfig: {
      maxOutputTokens: 100,
      temperature: 0.7,
    },
  })

  const chat = model.startChat({ history: [] })

  activeSessions.set(sessionId, { chat, mode, coachName })
  console.log(`Coaching session initialized: ${coachName} for session ${sessionId} in ${mode} mode`)
}

export async function getCoachingResponse(
  sessionId: string,
  text: string,
  context: { mode: string; emotion?: string; distance?: number }
): Promise<string> {
  const session = activeSessions.get(sessionId)
  if (!session) throw new Error(`No active coaching session for ${sessionId}`)

  let prompt = `[${context.mode}] User heard: "${text}"`
  if (context.emotion && context.emotion !== 'neutral') {
    prompt += ` | Target emotion: ${context.emotion}`
  }
  if (context.distance && context.distance > 0) {
    prompt += ` | Distance: ${Math.round(context.distance)}cm`
  }

  const result = await retryWithBackoff(
    () => session.chat.sendMessage(prompt),
    { maxRetries: 2, baseDelayMs: 1000, onRetry: (attempt, err) => {
      console.warn(`Gemini retry ${attempt} for session ${sessionId}:`, err.message)
    }}
  )
  const response = result.response.text()

  console.log(`Coach ${session.coachName}: "${response}"`)
  return response
}

export function updateCoachingMode(sessionId: string, newMode: string): void {
  const session = activeSessions.get(sessionId)
  if (!session) return

  session.mode = newMode

  // Send a mode-change context message to Gemini so it adapts
  retryWithBackoff(
    () => session.chat.sendMessage(
      `[SYSTEM] Mode changed to ${newMode}. Adjust your coaching style accordingly.`
    ),
    { maxRetries: 1, baseDelayMs: 500 }
  ).catch(err => console.error('Failed to update coaching mode:', err))

  console.log(`Coaching mode updated to ${newMode} for session ${sessionId}`)
}

export function endCoachingSession(sessionId: string): void {
  activeSessions.delete(sessionId)
  console.log(`Coaching session ended: ${sessionId}`)
}
