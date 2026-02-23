// Browser-native Text-to-Speech using the SpeechSynthesis API.
// Replaces ElevenLabs TTS to eliminate API costs.

let selectedVoice: SpeechSynthesisVoice | null = null
let voicesLoaded = false

function loadVoices(): SpeechSynthesisVoice[] {
  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) voicesLoaded = true
  return voices
}

// Pick a good default voice — prefer English, natural-sounding voices
function pickVoice(): SpeechSynthesisVoice | null {
  if (selectedVoice) return selectedVoice

  const voices = loadVoices()
  if (voices.length === 0) return null

  // Prefer: Google voices > "Natural" > any English voice > first available
  const english = voices.filter(v => v.lang.startsWith('en'))
  const google = english.filter(v => v.name.includes('Google'))
  const natural = english.filter(v => v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('premium'))

  selectedVoice = google[0] || natural[0] || english[0] || voices[0] || null
  return selectedVoice
}

// Wait for voices to be available (they load async in some browsers)
function ensureVoices(): Promise<void> {
  if (voicesLoaded) return Promise.resolve()
  return new Promise(resolve => {
    const check = () => {
      if (window.speechSynthesis.getVoices().length > 0) {
        voicesLoaded = true
        resolve()
      }
    }
    window.speechSynthesis.addEventListener('voiceschanged', check, { once: true })
    // Fallback: resolve after 2s even without voices
    setTimeout(() => resolve(), 2000)
    check()
  })
}

let speakQueue: string[] = []
let isSpeaking = false

async function drainQueue(): Promise<void> {
  if (isSpeaking) return
  isSpeaking = true

  while (speakQueue.length > 0) {
    const text = speakQueue.shift()!
    await speakOne(text)
  }

  isSpeaking = false
}

function speakOne(text: string): Promise<void> {
  return new Promise(resolve => {
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = pickVoice()
    if (voice) utterance.voice = voice
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    window.speechSynthesis.speak(utterance)
  })
}

/** Queue text for browser TTS playback. Non-blocking, plays in order. */
export async function speakText(text: string): Promise<void> {
  if (!window.speechSynthesis) {
    console.warn('[BrowserTTS] SpeechSynthesis not supported')
    return
  }
  await ensureVoices()
  speakQueue.push(text)
  void drainQueue()
}

/** Stop all speech immediately and clear the queue. */
export function stopSpeaking(): void {
  speakQueue = []
  isSpeaking = false
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}
