const audioQueue: Array<{ audio: string; format: string }> = []
let isPlaying = false
let isBlockedByAutoplay = false

function mimeTypeForFormat(format: string): string {
  const f = format.toLowerCase()
  // Most browsers expect MP3 to be labeled as audio/mpeg, not audio/mp3.
  if (f === 'mp3') return 'audio/mpeg'
  if (f === 'mpeg') return 'audio/mpeg'
  if (f === 'wav') return 'audio/wav'
  if (f === 'webm') return 'audio/webm'
  if (f === 'ogg') return 'audio/ogg'
  return `audio/${f}`
}

// Unlock audio context with a silent play during a user gesture (click).
// Must be called from a click/tap handler to satisfy browser autoplay policy.
export function unlockAudio(): void {
  const silent = new Audio('data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwF9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')
  silent.volume = 0
  silent.play().catch(() => {})

  // If autoplay was blocked earlier, retry queued audio now that we're in a user gesture.
  isBlockedByAutoplay = false
  if (!isPlaying && audioQueue.length > 0) {
    void drainQueue()
  }
}

// Clear all queued audio and stop playback
export function clearAudioQueue(): void {
  audioQueue.length = 0
  isPlaying = false
  isBlockedByAutoplay = false
}

function playAudio(base64Audio: string, format: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const byteCharacters = atob(base64Audio)
    const byteArray = new Uint8Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i)
    }
    const blob = new Blob([byteArray], { type: mimeTypeForFormat(format) })
    const url = URL.createObjectURL(blob)

    const audio = new Audio(url)
    audio.onended = () => {
      URL.revokeObjectURL(url)
      resolve()
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Audio playback failed'))
    }
    audio.play().catch(reject)
  })
}

async function drainQueue(): Promise<void> {
  if (isPlaying || isBlockedByAutoplay) return

  isPlaying = true
  try {
    while (audioQueue.length > 0) {
      const next = audioQueue.shift()!
      try {
        await playAudio(next.audio, next.format)
      } catch (err) {
        // Common when audio hasn't been unlocked by a user gesture yet.
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.toLowerCase().includes('notallowed') || msg.toLowerCase().includes('user gesture')) {
          // Put it back and wait for unlockAudio() to be called from a click/tap.
          audioQueue.unshift(next)
          isBlockedByAutoplay = true
          return
        }
        console.error('Audio playback error:', err)
      }
    }
  } finally {
    isPlaying = false
  }
}

export async function queueCoachAudio(base64Audio: string, format: string = 'mp3'): Promise<void> {
  audioQueue.push({ audio: base64Audio, format })
  void drainQueue()
}
