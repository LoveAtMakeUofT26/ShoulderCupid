// Template-based session analysis — replaces OpenAI analysis.
// Generates reports from transcript stats without any external API calls.

interface TranscriptEntry {
  timestamp?: Date
  speaker: 'user' | 'target' | 'coach'
  text: string
  emotion?: string
}

export interface AnalysisResult {
  summary: string
  highlights: string[]
  recommendations: string[]
}

export async function analyzeTranscript(transcript: TranscriptEntry[]): Promise<AnalysisResult> {
  if (!transcript.length) {
    return {
      summary: 'No conversation was recorded during this session.',
      highlights: [],
      recommendations: ['Try starting a conversation next session to get personalized feedback.'],
    }
  }

  // Gather stats
  const userMessages = transcript.filter(e => e.speaker === 'user')
  const targetMessages = transcript.filter(e => e.speaker === 'target')
  const coachMessages = transcript.filter(e => e.speaker === 'coach')
  const totalMessages = transcript.length

  const userRatio = userMessages.length / Math.max(totalMessages - coachMessages.length, 1)
  const targetRatio = targetMessages.length / Math.max(totalMessages - coachMessages.length, 1)

  // Estimate duration from transcript timestamps
  const timestamps = transcript
    .map(e => e.timestamp ? new Date(e.timestamp).getTime() : 0)
    .filter(t => t > 0)
  const durationMinutes = timestamps.length >= 2
    ? Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / 60000)
    : 0

  // Build summary
  let summaryParts: string[] = []
  if (durationMinutes > 0) {
    summaryParts.push(`Your conversation lasted about ${durationMinutes} minute${durationMinutes === 1 ? '' : 's'}`)
  }
  summaryParts.push(`with ${userMessages.length} messages from you and ${targetMessages.length} from them`)

  if (userRatio > 0.65) {
    summaryParts.push('You did most of the talking — try letting them share more next time')
  } else if (targetRatio > 0.65) {
    summaryParts.push('They were very engaged — great job getting them to open up')
  } else {
    summaryParts.push('The conversation had a nice balance of back and forth')
  }

  const summary = summaryParts.join('. ') + '.'

  // Build highlights
  const highlights: string[] = []
  if (targetMessages.length > 0) {
    highlights.push('You got them talking — that\'s the hardest part.')
  }
  if (coachMessages.length > 3) {
    highlights.push(`You received ${coachMessages.length} coaching tips and kept the conversation going.`)
  }
  if (userMessages.length > 2 && targetMessages.length > 2) {
    highlights.push('Good back-and-forth rhythm throughout the conversation.')
  }
  if (durationMinutes >= 3) {
    highlights.push(`Sustained a ${durationMinutes}-minute conversation — solid endurance.`)
  }
  if (highlights.length === 0) {
    highlights.push('You showed up and put yourself out there — that takes courage.')
  }

  // Build recommendations
  const recommendations: string[] = []
  if (userRatio > 0.65) {
    recommendations.push('Practice asking more open-ended questions to balance the conversation.')
  }
  if (targetMessages.length < 3) {
    recommendations.push('Try to draw them out more — ask about their interests and experiences.')
  }
  if (userMessages.length < 3) {
    recommendations.push('Share more about yourself to build connection and trust.')
  }
  if (durationMinutes < 2) {
    recommendations.push('Try to extend conversations a bit longer — aim for 3-5 minutes next time.')
  }
  if (recommendations.length === 0) {
    recommendations.push('Keep practicing! Each conversation builds your confidence.')
    recommendations.push('Try varying your topics to discover shared interests faster.')
  }

  return { summary, highlights: highlights.slice(0, 3), recommendations: recommendations.slice(0, 3) }
}
