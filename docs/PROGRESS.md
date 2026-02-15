# Cupid - Development Progress

## Current Status: AI Pipeline Working

The full coaching loop works: speak into mic -> ElevenLabs STT -> backend Gemini coaching -> ElevenLabs TTS -> audio playback. Ready for hardware integration and polish.

---

## Completed

### Epic 1: Backend Foundation
- [x] Express API server with TypeScript
- [x] MongoDB connection (Atlas)
- [x] Google OAuth authentication
- [x] Coach CRUD API + seed data (3 coaches with system prompts + voice IDs)
- [x] User profile & coach selection API

### Epic 2: Hardware API
- [x] Frame ingestion endpoint (`POST /api/frame`)
- [x] Sensor data endpoint (`POST /api/sensors`)
- [x] Command queue (`GET /api/commands`)
- [x] Device pairing (`POST /api/devices/pair`)
- [x] Warning trigger endpoint (`POST /api/trigger-warning`)
- [ ] ESP32-CAM MJPEG stream endpoint (`GET /api/stream`) - not implemented

### Epic 3: AI Pipeline
- [x] ElevenLabs Scribe STT (client-side, `@elevenlabs/react` useScribe hook)
- [x] Scribe token endpoint (`GET /api/stt/scribe-token`)
- [x] Gemini 2.0 Flash coaching (backend, `@google/generative-ai`)
- [x] Coach system prompt injection from MongoDB
- [x] Mode-aware coaching context (IDLE/APPROACH/CONVERSATION)
- [x] ElevenLabs TTS (backend, Flash v2.5 via REST API)
- [x] Socket.io pipeline orchestration (transcript -> Gemini -> TTS -> audio)
- [x] Audio playback service (queued, with autoplay unlock)
- [ ] Edge Impulse person detection
- [ ] Presage C++ emotion analysis (binary + metrics service scaffolded)

### Epic 4: Sessions & Reports
- [x] Session lifecycle API (start/end)
- [x] Transcript storage in MongoDB
- [x] Session mode tracking + analytics (approach_count, conversation_count, tips)
- [x] Session history page
- [x] Session detail page
- [ ] Post-session Gemini report generation
- [ ] Emotion timeline tracking

### Epic 5: Frontend Core
- [x] React + Vite + TypeScript scaffold
- [x] Tailwind with custom design system
- [x] Mobile app shell (BottomNav, AppShell, FAB)
- [x] Authentication flow (Google OAuth)
- [x] Dashboard page with coach card
- [x] Coaches page with selection
- [x] Sessions page with history
- [x] Settings page

### Epic 6: Live Session UI
- [x] Session start flow (pre-flight modal)
- [x] Live session page layout (mobile-first)
- [x] Socket.io connection for real-time data
- [x] Camera source selector (webcam / ESP32-CAM toggle)
- [x] Webcam video feed + frame capture service
- [x] Coaching panel (shows Gemini coaching text)
- [x] Live transcript stream (user + coach bubbles)
- [x] Stats bar (connection, timer, mode badge)
- [x] Warning/alert system
- [x] Target vitals panel (HR, breathing, HRV)
- [x] Session end flow + confirmation modal
- [x] Partial transcript display + mic status indicator
- [x] Audio settings (mic/speaker selection UI)

### Epic 7: Onboarding
- [x] Multi-step wizard flow
- [x] Personality quiz
- [x] Coach recommendation
- [ ] Hardware setup guide

### Epic 8: Landing & Payments
- [x] Marketing landing page (merged as separate app)
- [ ] Payment flow

### Design System
- [x] Color palette (Cupid pink, gold, marble)
- [x] Typography (Playfair Display + Inter)
- [x] Component styles (buttons, cards, nav)
- [x] Mobile-first layouts

---

## In Progress

### Bug Fixes & Polish
- [x] Fix socket port mismatch (was 4005, now 4000)
- [x] Fix IDLE mode blocking coaching (auto-promote to CONVERSATION without hardware)
- [x] Fix duplicate transcripts in UI
- [x] Fix browser autoplay blocking coach audio
- [x] Add audio queue clearing on session end
- [x] Add session-state socket event listener
- [ ] Add auth middleware to token endpoints (STT, Gemini)
- [ ] Add session ownership verification in socket handlers
- [ ] Clean up dead code (`geminiService.ts` frontend, unused env vars)

---

## Upcoming

### Hardware Integration
- [ ] ESP32-CAM firmware + MJPEG streaming
- [ ] Edge Impulse person detection (male/female/none)
- [ ] Presage C++ SDK emotion analysis on Vultr
- [ ] Sensor-driven mode transitions (IDLE -> APPROACH -> CONVERSATION)
- [ ] Comfort check + slap escalation logic

### Reports & Analytics
- [ ] Post-session Gemini report generation
- [ ] Emotion timeline visualization
- [ ] Session analytics dashboard

### Deployment
- [ ] Production deploy to Vultr (backend) + Vercel (frontend)
- [ ] End-to-end testing with real hardware

---

## Quick Commands

```bash
# Start development (both frontend + backend)
npm run dev

# Or individually:
cd apps/backend && npm run dev    # Backend on :4000
cd apps/frontend && npm run dev   # Frontend on :3000

# Seed database with coaches
cd apps/backend && npx tsx src/scripts/seed.ts

# Type check
cd apps/frontend && npx tsc --noEmit
cd apps/backend && npx tsc --noEmit
```

---

## Key Files

| File | Purpose |
|------|---------|
| `apps/backend/src/services/aiService.ts` | Gemini coaching session manager |
| `apps/backend/src/services/ttsService.ts` | ElevenLabs TTS (text -> mp3 audio) |
| `apps/backend/src/sockets/clientHandler.ts` | Socket pipeline hub (coaching orchestration) |
| `apps/backend/src/models/Coach.ts` | Coach schema (system_prompt, voice_id) |
| `apps/backend/src/models/Session.ts` | Session schema (mode, transcript, analytics) |
| `apps/backend/src/scripts/seed.ts` | Coach seed data (3 coaches) |
| `apps/frontend/src/hooks/useSessionSocket.ts` | Socket hook (all real-time state) |
| `apps/frontend/src/services/transcriptionService.ts` | ElevenLabs Scribe STT hook |
| `apps/frontend/src/services/audioPlaybackService.ts` | Coach audio playback queue |
| `apps/frontend/src/pages/LiveSessionPage.tsx` | Main session page |
| `apps/frontend/src/components/session/` | CoachingPanel, TranscriptStream, StatsBar, etc. |
| `apps/frontend/vite.config.ts` | Proxy config (/api + /socket.io -> :4000) |
| `.env.example` | Environment variable template |
