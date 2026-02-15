import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'

export interface TranscriptEntry {
  id: string
  timestamp: number
  speaker: 'user' | 'target' | 'coach'
  text: string
  emotion?: string
}

const SYSTEM_PROMPT = `You're a supportive friend giving real-time hints during a conversation. Like a wingman whispering in their ear.

You receive a live conversation transcript. Speakers: **user** (your friend), **target** (person they're talking to), **coach** (past tips).

**Output format: 1–5 words or one short sentence max.** Examples: "Ask about her weekend" • "Smile, you got this" • "Lean in" • "Nice, keep going" • "Change the subject" • "Tell a quick story"

**Partial transcripts**: Polled every 2 seconds. The last entry may be PARTIAL (same sentence evolving). Focus on the full picture. Only give NEW hints when there's meaningful new content—avoid repeating for the same unfinished sentence.

Sound like a friend: casual, encouraging, no fluff. Real-time readable—something you can glance at mid-convo.`

function formatTranscriptForPrompt(entries: TranscriptEntry[]): string {
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
  transcript: TranscriptEntry[]
): Promise<string> {
  if (!transcript.length) {
    return 'Listen, then share a bit about yourself.'
  }

  const formattedTranscript = formatTranscriptForPrompt(transcript)

  const response = await llm.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(
      `Conversation:\n\n${formattedTranscript}\n\nOne short hint (1-5 words or one sentence):`
    ),
  ])

  const content = response.content
  return typeof content === 'string' ? content : String(content)
}
