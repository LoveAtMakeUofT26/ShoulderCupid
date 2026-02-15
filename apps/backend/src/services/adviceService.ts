import { GoogleGenerativeAI, type ChatSession } from '@google/generative-ai'
import { loadEnv } from '../config/loadEnv.js'
import { retryWithBackoff } from '../utils/resilience.js'
import { ADVICE_SYSTEM_PROMPT, formatTranscriptForPrompt, getRelationshipAdvice, type TranscriptEntry } from './relationshipAdviceAgent.js'

loadEnv()

const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)

interface AdviceContext {
  chat: ChatSession
}

const activeSessions = new Map<string, AdviceContext>()

export function initAdviceSession(sessionId: string): void {
  activeSessions.delete(sessionId)

  if (!apiKey) {
    console.warn('No Gemini API key — advice will only use OpenAI')
    return
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    systemInstruction: ADVICE_SYSTEM_PROMPT,
    generationConfig: {
      maxOutputTokens: 64,
      temperature: 0.7,
    },
  })

  const chat = model.startChat({ history: [] })
  activeSessions.set(sessionId, { chat })
  console.log(`Advice session initialized for ${sessionId} (OpenAI primary, Gemini fallback)`)
}

export async function getAdvice(
  sessionId: string,
  transcript: TranscriptEntry[]
): Promise<string> {
  if (!transcript.length) {
    return 'Listen, then share a bit about yourself.'
  }

  // OpenAI first — already proven and working
  try {
    return await getRelationshipAdvice(transcript)
  } catch (err) {
    console.warn('OpenAI advice failed, trying Gemini fallback:', (err as Error).message)
  }

  // Gemini fallback
  const session = activeSessions.get(sessionId)
  if (!session) {
    return 'Listen, then share a bit.'
  }

  const formatted = formatTranscriptForPrompt(transcript)
  const prompt = `Conversation:\n\n${formatted}\n\nOne short hint (1-5 words or one sentence):`

  try {
    const result = await retryWithBackoff(
      () => session.chat.sendMessage(prompt),
      {
        maxRetries: 1,
        baseDelayMs: 500,
        onRetry: (attempt, err) => {
          console.warn(`Advice Gemini retry ${attempt} for ${sessionId}:`, err.message)
        },
      }
    )
    const text = result.response.text().trim()
    if (!text) throw new Error('Empty Gemini response')
    return text
  } catch (geminiErr) {
    console.error('Both OpenAI and Gemini advice failed:', (geminiErr as Error).message)
    return 'Listen, then share a bit.'
  }
}

export function endAdviceSession(sessionId: string): void {
  activeSessions.delete(sessionId)
  console.log(`Advice session ended: ${sessionId}`)
}
