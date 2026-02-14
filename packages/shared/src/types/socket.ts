// Socket.io event types

export interface ServerToClientEvents {
  'esp32-video-frame': (data: VideoFrameData) => void
  'esp32-audio-data': (data: AudioData) => void
  'coach-audio': (data: CoachAudioData) => void
  'session-started': (sessionId: string) => void
  'session-ended': (sessionId: string) => void
  'transcript-update': (entry: TranscriptUpdate) => void
}

export interface ClientToServerEvents {
  identify: (data: { type: 'esp32' | 'web-client' }) => void
  'watch-device': (deviceId: string) => void
  'stop-watching': (deviceId: string) => void
  'video-frame': (frameData: Buffer) => void
  'audio-data': (audioData: Buffer) => void
  'request-coach-audio': () => void
}

export interface VideoFrameData {
  deviceId: string
  frame: Buffer
  timestamp: number
}

export interface AudioData {
  deviceId: string
  audio: Buffer
  timestamp: number
}

export interface CoachAudioData {
  audio: Buffer
}

export interface TranscriptUpdate {
  sessionId: string
  speaker: 'user' | 'coach'
  text: string
  timestamp: Date
}
