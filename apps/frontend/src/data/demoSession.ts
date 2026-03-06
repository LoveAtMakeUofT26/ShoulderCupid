// Demo session script - plays back a simulated coaching session

export interface DemoEvent {
  time: number // ms from start
  type: 'mode' | 'coaching' | 'transcript' | 'emotion' | 'sensors' | 'warning'
  data: Record<string, unknown>
}

export interface TranscriptEntry {
  id: string
  speaker: 'user' | 'target' | 'coach'
  text: string
  timestamp: number
  emotion?: string
}

// Demo script for Smooth Operator
export const smoothOperatorDemo: DemoEvent[] = [
  // Session starts
  { time: 0, type: 'mode', data: { mode: 'IDLE' } },
  { time: 0, type: 'coaching', data: { message: "Session started! I'm scanning for potential targets..." } },
  { time: 0, type: 'sensors', data: { heartRate: 75, distance: -1 } },

  // Person detected
  { time: 3000, type: 'mode', data: { mode: 'APPROACH' } },
  { time: 3000, type: 'coaching', data: { message: "I see someone! She's about 3 meters away. Take a breath." } },
  { time: 3000, type: 'sensors', data: { heartRate: 82, distance: 320 } },
  { time: 3000, type: 'emotion', data: { emotion: 'neutral' } },

  // Building up
  { time: 5000, type: 'coaching', data: { message: "Alright king, walk over casual. Not too fast." } },
  { time: 5000, type: 'sensors', data: { heartRate: 88, distance: 280 } },

  // Getting closer
  { time: 7000, type: 'sensors', data: { heartRate: 92, distance: 200 } },
  { time: 7000, type: 'coaching', data: { message: "Good pace. She noticed you. Make eye contact and smile." } },

  // Entering conversation
  { time: 9000, type: 'mode', data: { mode: 'CONVERSATION' } },
  { time: 9000, type: 'sensors', data: { heartRate: 95, distance: 120 } },
  { time: 9000, type: 'coaching', data: { message: "You're in. Open with something simple." } },

  // First exchange
  { time: 11000, type: 'transcript', data: { speaker: 'user', text: "Hey, I noticed your book. Is that any good?" } },
  { time: 11000, type: 'sensors', data: { heartRate: 98 } },

  { time: 13000, type: 'transcript', data: { speaker: 'target', text: "Oh this? Yeah it's actually really great! You read?" } },
  { time: 13000, type: 'emotion', data: { emotion: 'happy' } },
  { time: 13000, type: 'coaching', data: { message: "She's smiling! Great opener. Keep it going." } },

  // Deeper conversation
  { time: 16000, type: 'transcript', data: { speaker: 'user', text: "I try to! Just finished a sci-fi one. What genre is that?" } },
  { time: 16000, type: 'sensors', data: { heartRate: 92 } },

  { time: 18000, type: 'transcript', data: { speaker: 'target', text: "It's a thriller. I love anything suspenseful!" } },
  { time: 18000, type: 'emotion', data: { emotion: 'happy' } },

  { time: 19000, type: 'coaching', data: { message: "Perfect! You found common ground. Ask for a recommendation." } },

  { time: 22000, type: 'transcript', data: { speaker: 'user', text: "Any recommendations? I need something new." } },
  { time: 22000, type: 'sensors', data: { heartRate: 88 } },

  { time: 24000, type: 'transcript', data: { speaker: 'target', text: "Hmm... have you read Gone Girl? It's a classic." } },
  { time: 24000, type: 'emotion', data: { emotion: 'surprised' } },

  { time: 25000, type: 'coaching', data: { message: "She's engaged! This is the perfect moment. Get her contact." } },

  // Getting contact
  { time: 28000, type: 'transcript', data: { speaker: 'user', text: "I haven't! Maybe you could text me more recs?" } },
  { time: 28000, type: 'sensors', data: { heartRate: 95 } },

  { time: 30000, type: 'transcript', data: { speaker: 'target', text: "Haha smooth. Sure, here's my number." } },
  { time: 30000, type: 'emotion', data: { emotion: 'happy' } },
  { time: 30000, type: 'coaching', data: { message: "YES KING! You got the number. Now exit gracefully." } },

  // Natural exit
  { time: 33000, type: 'transcript', data: { speaker: 'user', text: "Perfect! I'll text you. Got to run but nice meeting you!" } },
  { time: 33000, type: 'sensors', data: { heartRate: 85 } },

  { time: 35000, type: 'transcript', data: { speaker: 'target', text: "Nice meeting you too! Talk soon." } },
  { time: 35000, type: 'emotion', data: { emotion: 'happy' } },

  { time: 36000, type: 'coaching', data: { message: "That was textbook perfect! Great job." } },
  { time: 36000, type: 'mode', data: { mode: 'IDLE' } },
  { time: 36000, type: 'sensors', data: { heartRate: 78, distance: 300 } },

  // Final
  { time: 38000, type: 'coaching', data: { message: "Session complete. You killed it! Ready for the report?" } },
]

// Demo script for Wingman Chad
export const wingmanChadDemo: DemoEvent[] = [
  { time: 0, type: 'mode', data: { mode: 'IDLE' } },
  { time: 0, type: 'coaching', data: { message: "LET'S GO! Looking for targets..." } },
  { time: 0, type: 'sensors', data: { heartRate: 80, distance: -1 } },

  { time: 3000, type: 'mode', data: { mode: 'APPROACH' } },
  { time: 3000, type: 'coaching', data: { message: "BRO. 10 o'clock. She's cute. You're about to make her day!" } },
  { time: 3000, type: 'sensors', data: { heartRate: 88, distance: 350 } },
  { time: 3000, type: 'emotion', data: { emotion: 'neutral' } },

  { time: 5000, type: 'coaching', data: { message: "Walk over like you own the place. You got this EASY!" } },
  { time: 5000, type: 'sensors', data: { heartRate: 95, distance: 250 } },

  { time: 7000, type: 'sensors', data: { heartRate: 102, distance: 180 } },
  { time: 7000, type: 'warning', data: { level: 1, message: "Take a breath bro. You're rushing a bit!" } },

  { time: 9000, type: 'mode', data: { mode: 'CONVERSATION' } },
  { time: 9000, type: 'sensors', data: { heartRate: 100, distance: 120 } },
  { time: 9000, type: 'coaching', data: { message: "You're IN! Just be yourself king!" } },

  { time: 11000, type: 'transcript', data: { speaker: 'user', text: "Hey! This seat taken?" } },
  { time: 11000, type: 'sensors', data: { heartRate: 105 } },

  { time: 13000, type: 'transcript', data: { speaker: 'target', text: "Nope, go ahead!" } },
  { time: 13000, type: 'emotion', data: { emotion: 'happy' } },
  { time: 13000, type: 'coaching', data: { message: "She's smiling! She's into it bro!" } },

  { time: 16000, type: 'transcript', data: { speaker: 'user', text: "This place is packed tonight huh?" } },

  { time: 18000, type: 'transcript', data: { speaker: 'target', text: "Yeah it's crazy! You come here often?" } },
  { time: 18000, type: 'coaching', data: { message: "BRO she asked YOU a question! That's interest!" } },

  { time: 21000, type: 'transcript', data: { speaker: 'user', text: "First time actually! My friend said the drinks are good." } },
  { time: 21000, type: 'sensors', data: { heartRate: 95 } },

  { time: 23000, type: 'transcript', data: { speaker: 'target', text: "They are! Try the margarita." } },
  { time: 23000, type: 'emotion', data: { emotion: 'happy' } },

  { time: 24000, type: 'coaching', data: { message: "King energy! She's giving you tips. Ask for the number!" } },

  { time: 27000, type: 'transcript', data: { speaker: 'user', text: "I'll definitely try it! Hey you seem cool, can I get your number?" } },
  { time: 27000, type: 'sensors', data: { heartRate: 110 } },

  { time: 29000, type: 'transcript', data: { speaker: 'target', text: "Haha direct! I like that. Here you go." } },
  { time: 29000, type: 'emotion', data: { emotion: 'surprised' } },
  { time: 29000, type: 'coaching', data: { message: "BROOO! YOU DID IT! That's how it's DONE!" } },

  { time: 32000, type: 'coaching', data: { message: "Legendary performance. You're a natural!" } },
  { time: 32000, type: 'mode', data: { mode: 'IDLE' } },
]

// Demo script for Gentle Guide
export const gentleGuideDemo: DemoEvent[] = [
  { time: 0, type: 'mode', data: { mode: 'IDLE' } },
  { time: 0, type: 'coaching', data: { message: "Take a deep breath. We'll start when you're ready." } },
  { time: 0, type: 'sensors', data: { heartRate: 72, distance: -1 } },

  { time: 4000, type: 'mode', data: { mode: 'APPROACH' } },
  { time: 4000, type: 'coaching', data: { message: "I see someone reading alone. No pressure. Just say hello when you feel ready." } },
  { time: 4000, type: 'sensors', data: { heartRate: 78, distance: 400 } },
  { time: 4000, type: 'emotion', data: { emotion: 'neutral' } },

  { time: 7000, type: 'coaching', data: { message: "Remember, this is just a conversation. Nothing more, nothing less." } },
  { time: 7000, type: 'sensors', data: { heartRate: 82, distance: 300 } },

  { time: 10000, type: 'sensors', data: { heartRate: 85, distance: 200 } },
  { time: 10000, type: 'coaching', data: { message: "You're doing great. Nice calm pace." } },

  { time: 13000, type: 'mode', data: { mode: 'CONVERSATION' } },
  { time: 13000, type: 'sensors', data: { heartRate: 88, distance: 130 } },
  { time: 13000, type: 'coaching', data: { message: "Just be yourself. That's always enough." } },

  { time: 15000, type: 'transcript', data: { speaker: 'user', text: "Hi, sorry to interrupt. I was curious about your book." } },

  { time: 17000, type: 'transcript', data: { speaker: 'target', text: "Oh no worries! It's called The Midnight Library. Have you read it?" } },
  { time: 17000, type: 'emotion', data: { emotion: 'happy' } },
  { time: 17000, type: 'coaching', data: { message: "Beautiful. She's open to talking. Just listen." } },

  { time: 20000, type: 'transcript', data: { speaker: 'user', text: "I haven't, but I love the concept. Is it as good as people say?" } },
  { time: 20000, type: 'sensors', data: { heartRate: 82 } },

  { time: 23000, type: 'transcript', data: { speaker: 'target', text: "It's beautiful. Really makes you think about life choices." } },
  { time: 23000, type: 'emotion', data: { emotion: 'neutral' } },

  { time: 25000, type: 'coaching', data: { message: "She's sharing something meaningful. Be present with her." } },

  { time: 28000, type: 'transcript', data: { speaker: 'user', text: "That sounds exactly what I need right now. Any other favorites?" } },

  { time: 31000, type: 'transcript', data: { speaker: 'target', text: "So many! I could talk books all day honestly." } },
  { time: 31000, type: 'emotion', data: { emotion: 'happy' } },

  { time: 32000, type: 'coaching', data: { message: "There's a genuine connection forming. Take your time." } },

  { time: 35000, type: 'transcript', data: { speaker: 'user', text: "I'd love to hear more sometime. Maybe over coffee?" } },
  { time: 35000, type: 'sensors', data: { heartRate: 90 } },

  { time: 38000, type: 'transcript', data: { speaker: 'target', text: "That sounds lovely. Here, let me give you my number." } },
  { time: 38000, type: 'emotion', data: { emotion: 'happy' } },
  { time: 38000, type: 'coaching', data: { message: "Wonderful. You were authentic, and she responded to that." } },

  { time: 42000, type: 'coaching', data: { message: "Beautiful connection. You did wonderfully." } },
  { time: 42000, type: 'mode', data: { mode: 'IDLE' } },
]

// Get demo for a coach by ID
export function getDemoForCoach(coachId: string): DemoEvent[] {
  switch (coachId) {
    case 'coach-wingman-chad':
      return wingmanChadDemo
    case 'coach-gentle-guide':
      return gentleGuideDemo
    default:
      return smoothOperatorDemo
  }
}
