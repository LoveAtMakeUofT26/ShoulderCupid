import { Server, Socket } from 'socket.io'

export function setupESP32Handler(socket: Socket, io: Server) {
  console.log(`🤖 ESP32 device connected: ${socket.id}`)

  // Receive video frames from ESP32
  socket.on('video-frame', (frameData: Buffer) => {
    // Broadcast to web clients watching this device
    io.emit('esp32-video-frame', {
      deviceId: socket.id,
      frame: frameData,
      timestamp: Date.now(),
    })
  })

  // Receive audio from ESP32 microphone
  socket.on('audio-data', (audioData: Buffer) => {
    // Process audio (STT, LLM, TTS) - placeholder for Epic 3
    io.emit('esp32-audio-data', {
      deviceId: socket.id,
      audio: audioData,
      timestamp: Date.now(),
    })
  })

  // Send audio back to ESP32 (coach voice)
  socket.on('request-coach-audio', () => {
    // Placeholder: Will integrate ElevenLabs TTS in Epic 3
    socket.emit('coach-audio', {
      audio: Buffer.from([]), // TTS output will go here
    })
  })
}
