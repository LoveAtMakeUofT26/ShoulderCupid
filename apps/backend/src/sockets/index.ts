import { Server } from 'socket.io'
import { setupESP32Handler } from './esp32Handler.js'
import { setupClientHandler } from './clientHandler.js'

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    const socketDebug = process.env.SOCKET_DEBUG === 'true'
    if (socketDebug) {
      const headers = socket.handshake?.headers || {}
      const origin = (headers.origin as string | undefined) || (headers.referer as string | undefined)
      const hasCookie = Boolean(headers.cookie)
      const transport = (socket.conn as any)?.transport?.name
      const userId =
        (socket.request as any)?.user?._id?.toString?.() ||
        (socket.request as any)?.session?.passport?.user ||
        null

      console.log('[socket] connect', {
        id: socket.id,
        transport,
        origin,
        hasCookie,
        userId,
      })

      socket.onAny((event, ...args) => {
        // Avoid logging huge payloads (e.g. base64 audio).
        if (event === 'coach-audio') return
        const preview = args.map((arg) => {
          if (typeof arg === 'string') return arg.slice(0, 300)
          if (typeof arg === 'number' || typeof arg === 'boolean' || arg == null) return arg
          try {
            const json = JSON.stringify(arg)
            return json.length > 600 ? `${json.slice(0, 600)}...` : json
          } catch {
            return '[unserializable]'
          }
        })
        console.log('[socket] <-', socket.id, event, preview)
      })
    }

    // Detect client type based on first event
    socket.on('identify', (data: { type: 'esp32' | 'web-client' }, ack?: (resp: { ok: true; type: string }) => void) => {
      if (data.type === 'esp32') {
        console.log(`ESP32 connected: ${socket.id}`)
        setupESP32Handler(socket, io)
      } else {
        setupClientHandler(socket, io)
      }

      ack?.({ ok: true, type: data.type })
    })

    socket.on('disconnect', () => {
      if (process.env.SOCKET_DEBUG === 'true') {
        console.log('[socket] disconnect', { id: socket.id })
      }
    })
  })
}
