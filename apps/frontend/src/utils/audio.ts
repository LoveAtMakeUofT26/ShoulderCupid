// Simple audio feedback using Web Audio API
// No external files needed!

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return audioContext
}

// Play a simple beep/tone
function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  try {
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = type
    gainNode.gain.value = volume

    // Fade out
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch (e) {
    console.warn('Audio playback failed:', e)
  }
}

// Sound effects
export const sounds = {
  // Soft click for button presses
  click: () => playTone(800, 0.05, 'sine', 0.15),

  // Success sound - ascending
  success: () => {
    playTone(523, 0.1, 'sine', 0.2) // C5
    setTimeout(() => playTone(659, 0.1, 'sine', 0.2), 100) // E5
    setTimeout(() => playTone(784, 0.15, 'sine', 0.2), 200) // G5
  },

  // Notification - coaching message
  coaching: () => {
    playTone(880, 0.08, 'sine', 0.15) // A5
    setTimeout(() => playTone(1047, 0.1, 'sine', 0.15), 80) // C6
  },

  // Mode change - subtle chime
  modeChange: () => {
    playTone(659, 0.1, 'triangle', 0.2) // E5
    setTimeout(() => playTone(784, 0.15, 'triangle', 0.2), 100) // G5
  },

  // Warning level 1 - gentle
  warningLight: () => {
    playTone(440, 0.15, 'sine', 0.25) // A4
  },

  // Warning level 2 - medium
  warningMedium: () => {
    playTone(440, 0.1, 'square', 0.2)
    setTimeout(() => playTone(440, 0.1, 'square', 0.2), 150)
  },

  // Warning level 3 - urgent
  warningUrgent: () => {
    playTone(440, 0.08, 'square', 0.3)
    setTimeout(() => playTone(440, 0.08, 'square', 0.3), 100)
    setTimeout(() => playTone(440, 0.08, 'square', 0.3), 200)
  },

  // Transcript message received
  message: () => playTone(660, 0.05, 'sine', 0.1),

  // Session start
  sessionStart: () => {
    playTone(392, 0.1, 'sine', 0.2) // G4
    setTimeout(() => playTone(523, 0.1, 'sine', 0.2), 100) // C5
    setTimeout(() => playTone(659, 0.1, 'sine', 0.2), 200) // E5
    setTimeout(() => playTone(784, 0.2, 'sine', 0.2), 300) // G5
  },

  // Session end
  sessionEnd: () => {
    playTone(784, 0.1, 'sine', 0.2) // G5
    setTimeout(() => playTone(659, 0.1, 'sine', 0.2), 100) // E5
    setTimeout(() => playTone(523, 0.15, 'sine', 0.2), 200) // C5
  },

  // Check passed
  checkPass: () => playTone(880, 0.08, 'sine', 0.15),

  // Check failed
  checkFail: () => playTone(220, 0.15, 'sawtooth', 0.15),
}

// Play warning sound based on level
export function playWarningSound(level: number) {
  switch (level) {
    case 1:
      sounds.warningLight()
      break
    case 2:
      sounds.warningMedium()
      break
    case 3:
      sounds.warningUrgent()
      break
  }
}
