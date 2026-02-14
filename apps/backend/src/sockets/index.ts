import { Server } from 'socket.io'
import { setupESP32Handler } from './esp32Handler.js'
import { setupClientHandler } from './clientHandler.js'

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    // Detect client type based on first event
    socket.on('identify', (data: { type: 'esp32' | 'web-client' }) => {
      if (data.type === 'esp32') {
        console.log(`ESP32 connected: ${socket.id}`)
        setupESP32Handler(socket, io)
      } else {
        setupClientHandler(socket, io)
      }
    })

    socket.on('disconnect', () => {
      // Only log ESP32 disconnects (web clients are noisy)
    })
  })
}
