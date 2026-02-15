import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'

export interface TranscriptEntry {
  id: string
  timestamp: number
  speaker: 'user' | 'target' | 'coach'
  text: string
  emotion?: string
}

export const ADVICE_SYSTEM_PROMPT = `You're a supportive friend giving real-time hints during a conversation. Like a wingman whispering in their ear.

You receive a live conversation transcript. Speakers: **user** (your friend), **target** (person they're talking to), **coach** (past tips).

**Output format: 1–5 words or one short sentence max.** Examples: "Ask about her weekend" • "Smile, you got this" • "Lean in" • "Nice, keep going" • "Change the subject" • "Tell a quick story"

**Partial transcripts**: Polled every 4 seconds. The last entry may be PARTIAL (same sentence evolving). Focus on the full picture. Only give NEW hints when there's meaningful new content—avoid repeating for the same unfinished sentence.

**Variety rule**: NEVER repeat the same idea, theme, or wording as a recent tip. Each new hint must address a DIFFERENT aspect of the conversation (body language, topic suggestion, tone, ask a question, give a compliment, pacing, energy, listening). If nothing new is worth commenting on, respond with exactly "---" and nothing else.

Sound like a friend: casual, encouraging, no fluff. Real-time readable—something you can glance at mid-convo.`

export function formatTranscriptForPrompt(entries: TranscriptEntry[]): string {
  return entries
    .map((e) => {
      const emotion = e.emotion ? ` [emotion: ${e.emotion}]` : ''
      const partial = e.id === 'partial' ? ' [PARTIAL - in progress, same utterance may appear in multiple polls]' : ''
      return `[${e.speaker}]${emotion}${partial}: ${e.text}`
    })
    .join('\n')
}

const llm = new ChatOpenAI({
  model: 'gpt-4o-mini',
  apiKey: process.env.OPENAI_API_KEY,
  maxTokens: 64,
  temperature: 0.7,
})

export async function getRelationshipAdvice(
  transcript: TranscriptEntry[],
  recentAdvice: string[] = []
): Promise<string> {
  if (!transcript.length) {
    return 'Listen, then share a bit about yourself.'
  }

  const formattedTranscript = formatTranscriptForPrompt(transcript)

  const recentBlock = recentAdvice.length > 0
    ? `\n\nDO NOT repeat or paraphrase any of these recent tips:\n${recentAdvice.map(a => `- "${a}"`).join('\n')}\n\nGive a DIFFERENT type of advice.`
    : ''

  const response = await llm.invoke([
    new SystemMessage(ADVICE_SYSTEM_PROMPT),
    new HumanMessage(
      `Conversation:\n\n${formattedTranscript}${recentBlock}\n\nOne short hint (1-5 words or one sentence):`
    ),
  ])

  const content = response.content
  const trimmed = (typeof content === 'string' ? content : String(content)).trim()
  if (trimmed === '---') return ''
  return trimmed
}
