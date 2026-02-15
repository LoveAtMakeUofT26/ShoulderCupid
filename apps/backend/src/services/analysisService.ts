import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { loadEnv } from '../config/loadEnv.js'
import type { TranscriptEntry } from './relationshipAdviceAgent.js'

loadEnv()

const llm = new ChatOpenAI({
  model: 'gpt-4o-mini',
  apiKey: process.env.OPENAI_API_KEY,
  maxTokens: 600,
  temperature: 0.7,
})

const ANALYSIS_SYSTEM_PROMPT = `You are a dating coach reviewing a conversation transcript from a coaching session. The user wore smart glasses with an AI coach whispering advice during a social interaction.

Speakers in the transcript:
- **user**: your client (the person being coached)
- **target**: the person they were talking to
- **coach**: real-time coaching tips delivered during the conversation

Analyze the conversation and return a JSON object with exactly this structure:
{
  "summary": "2-3 sentence overview of how the interaction went",
  "highlights": ["positive moment 1", "positive moment 2", "positive moment 3"],
  "recommendations": ["actionable tip 1", "actionable tip 2", "actionable tip 3"]
}

Guidelines:
- Summary should be encouraging but honest
- Highlights should reference specific moments from the transcript
- Recommendations should be concrete and actionable for next time
- Keep each item to one sentence
- Return ONLY valid JSON, no markdown fences`

export interface AnalysisResult {
  summary: string
  highlights: string[]
  recommendations: string[]
}

function formatTranscript(entries: TranscriptEntry[]): string {
  return entries
    .map(e => {
      const emotion = e.emotion ? ` [${e.emotion}]` : ''
      return `[${e.speaker}${emotion}]: ${e.text}`
    })
    .join('\n')
}

export async function analyzeTranscript(transcript: TranscriptEntry[]): Promise<AnalysisResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  if (!transcript.length) {
    return {
      summary: 'No conversation was recorded during this session.',
      highlights: [],
      recommendations: ['Try starting a conversation next session to get personalized feedback.'],
    }
  }

  const formatted = formatTranscript(transcript)

  const response = await llm.invoke([
    new SystemMessage(ANALYSIS_SYSTEM_PROMPT),
    new HumanMessage(`Transcript:\n\n${formatted}\n\nAnalyze this conversation and return JSON:`),
  ])

  const text = typeof response.content === 'string' ? response.content : String(response.content)

  try {
    return JSON.parse(text.trim())
  } catch {
    console.error('[analysis] Failed to parse OpenAI response:', text)
    return {
      summary: text.trim().slice(0, 500),
      highlights: [],
      recommendations: [],
    }
  }
}
