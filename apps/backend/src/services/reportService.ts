import { GoogleGenerativeAI } from '@google/generative-ai'
import { loadEnv } from '../config/loadEnv.js'
import { Session } from '../models/Session.js'
import { retryWithBackoff } from '../utils/resilience.js'

loadEnv()

const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)

interface ReportOutput {
  summary: string
  highlights: string[]
  improvements: string[]
}

function buildPrompt(
  coachName: string,
  durationSeconds: number,
  transcript: Array<{ speaker: string; text: string; emotion?: string }>,
  analytics: { total_tips: number; approach_count: number; conversation_count: number; avg_emotion_score?: number; warnings_triggered: number }
): string {
  const mins = Math.round(durationSeconds / 60)
  const transcriptText = transcript
    .map(t => `[${t.speaker}${t.emotion ? ` (${t.emotion})` : ''}]: ${t.text}`)
    .join('\n')

  return `You are analyzing a dating coaching session. The user wore smart glasses with an AI coach named "${coachName}" whispering advice in their ear during a social interaction.

Session duration: ${mins} minute${mins !== 1 ? 's' : ''}
Tips given: ${analytics.total_tips}
Approaches: ${analytics.approach_count}
Conversations: ${analytics.conversation_count}
${analytics.avg_emotion_score != null ? `Average emotion score: ${analytics.avg_emotion_score.toFixed(1)}` : ''}
Warnings triggered: ${analytics.warnings_triggered}

Transcript:
${transcriptText || '(No transcript recorded)'}

Generate a post-session report as JSON with exactly this structure:
{
  "summary": "2-3 sentence overview of how the session went",
  "highlights": ["positive moment 1", "positive moment 2", "positive moment 3"],
  "improvements": ["area to improve 1", "area to improve 2"]
}

Guidelines:
- Summary should be encouraging but honest
- Highlights should reference specific moments from the transcript when possible
- Improvements should be actionable and specific
- Keep each item to one sentence
- If the transcript is empty, base the report on the analytics only
- Return ONLY valid JSON, no markdown fences`
}

export async function generateSessionReport(sessionId: string): Promise<void> {
  if (!apiKey) {
    console.warn('[report] No Gemini API key — skipping report generation')
    return
  }

  const session = await Session.findById(sessionId).populate('coach_id')
  if (!session) {
    console.error(`[report] Session ${sessionId} not found`)
    return
  }

  if (session.report?.summary) {
    console.log(`[report] Session ${sessionId} already has a report`)
    return
  }

  const coachName = (session.coach_id as any)?.name || 'Coach'
  const durationSeconds = session.duration_seconds || 0
  const transcript = (session.transcript || []).map((t: any) => ({
    speaker: t.speaker,
    text: t.text,
    emotion: t.emotion,
  }))
  const analytics = {
    total_tips: session.analytics?.total_tips || 0,
    approach_count: session.analytics?.approach_count || 0,
    conversation_count: session.analytics?.conversation_count || 0,
    avg_emotion_score: session.analytics?.avg_emotion_score ?? undefined,
    warnings_triggered: session.analytics?.warnings_triggered || 0,
  }

  const prompt = buildPrompt(coachName, durationSeconds, transcript, analytics)

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  })

  const result = await retryWithBackoff(
    () => model.generateContent(prompt),
    {
      maxRetries: 2,
      baseDelayMs: 1000,
      onRetry: (attempt, err) => {
        console.warn(`[report] Gemini retry ${attempt} for session ${sessionId}:`, err.message)
      },
    }
  )

  const text = result.response.text().trim()
  let report: ReportOutput

  try {
    report = JSON.parse(text)
  } catch {
    console.error(`[report] Failed to parse Gemini response for session ${sessionId}:`, text)
    report = {
      summary: 'Session completed. Report generation encountered an issue — check back later.',
      highlights: [],
      improvements: [],
    }
  }

  await Session.findByIdAndUpdate(sessionId, {
    report: {
      summary: report.summary,
      highlights: report.highlights || [],
      improvements: report.improvements || [],
      generated_at: new Date(),
    },
  })

  console.log(`[report] Generated report for session ${sessionId}`)
}
