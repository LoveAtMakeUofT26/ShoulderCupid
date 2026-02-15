const audioQueue: Array<{ audio: string; format: string }> = []
let isPlaying = false

function playAudio(base64Audio: string, format: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const byteCharacters = atob(base64Audio)
    const byteArray = new Uint8Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i)
    }
    const blob = new Blob([byteArray], { type: `audio/${format}` })
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

export async function queueCoachAudio(base64Audio: string, format: string = 'mp3'): Promise<void> {
  audioQueue.push({ audio: base64Audio, format })
  if (isPlaying) return

  isPlaying = true
  while (audioQueue.length > 0) {
    const next = audioQueue.shift()!
    try {
      await playAudio(next.audio, next.format)
    } catch (err) {
      console.error('Audio playback error:', err)
    }
  }
  isPlaying = false
}
