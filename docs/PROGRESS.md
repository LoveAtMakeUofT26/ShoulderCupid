# Cupid - Development Progress

## Current Status: ~85% Complete 🔄

Foundation complete. Full AI coaching pipeline working end-to-end: ElevenLabs Scribe STT (client-side) → Socket.io → Gemini 2.0 Flash coaching (server-side) → ElevenLabs TTS → audio playback. Live session UI with real preflight checks, Presage vitals, and transcript persistence. AI coach generation pipeline with Tinder-style discovery, roster management, and voice preview. Premium desktop UI with responsive sidebar navigation and dark mode theme system.

---

## Completed

### Epic 1: Backend Foundation ✅
- [x] Express API server with TypeScript
- [x] MongoDB connection (Atlas)
- [x] Google OAuth authentication
- [x] Coach CRUD API + seed data (3 coaches)
- [x] AI coach generation pipeline (Gemini AI profiles + Cloudflare Workers AI avatars)
- [x] Coach roster system (add/remove/set-default, free: 3, premium: 9)
- [x] Voice pool with trait-based matching (30 ElevenLabs voices)
- [x] User profile & coach selection API

### Epic 5: Frontend Core ✅
- [x] React + Vite + TypeScript scaffold
- [x] Tailwind with custom design system
- [x] Mobile app shell (BottomNav, AppShell, FAB)
- [x] Authentication flow (Google OAuth)
- [x] Dashboard page with coach card
- [x] Coaches page with selection
- [x] Tinder-style coach discovery page (swipe to discover AI coaches)
- [x] Coach detail modal with voice preview
- [x] Roster management UI (add/remove coaches, set default)
- [x] Sessions page with backend API
- [x] Settings page (wired with real data)

### Design System ✅
- [x] Color palette (Cupid pink, gold, marble)
- [x] Typography (Playfair Display + Inter)
- [x] Component styles (buttons, cards, nav)
- [x] Mobile-first layouts
- [x] Dark mode theme system (CSS custom properties, light/dark/system toggle)
- [x] Desktop sidebar navigation (SideNav with theme toggle)
- [x] Responsive layouts (mobile bottom nav + desktop sidebar)

### Epic 7: Onboarding ✅
- [x] Multi-step wizard
- [x] Personality quiz
- [x] Coach recommendation

### Epic 8: Landing Page ✅
- [x] Marketing landing page with Greek marble aesthetic

---

## In Progress

### Epic 6: Live Session UI 🔄
- [x] Session start flow (real preflight checks + I/O setup)
- [x] Live session page layout (mobile-first)
- [x] WebSocket connection for real-time data
- [x] Camera feed (webcam + ESP32-CAM sources)
- [x] Coaching panel (current tip display)
- [x] Live transcript stream with partial transcript indicator
- [x] Stats bar (connection, timer, mode)
- [x] Warning/alert system
- [x] Session end flow
- [ ] Video feed overlay (person detection box, emotion label) - needs Edge Impulse

### Epic 2: Hardware + Presage Integration 🔄
- [x] Frame ingestion endpoint (`POST /api/frame`)
- [x] Sensor data endpoint (`POST /api/sensors`)
- [x] Command queue (`GET /api/commands` for buzz, slap)
- [x] Configurable camera source (webcam or ESP32-CAM)
- [x] Webcam frame capture service (2 FPS, JPEG to `/api/frame`)
- [x] Frame buffer service (saves frames, stitches MP4 via ffmpeg)
- [x] Presage C++ processor integration (HR, breathing, HRV, blink/talk)
- [x] Target vitals panel in live session UI
- [ ] Device pairing flow

### Epic 3: AI Pipeline ✅ (Core Complete)
- [x] ElevenLabs STT (client-side Scribe v2 realtime + backend token endpoint)
- [x] Gemini coaching (server-side Gemini 2.0 Flash chat sessions with mode/emotion/distance context)
- [x] Backend coaching pipeline (transcript-input → Gemini → coaching-update + coach-audio)
- [x] ElevenLabs TTS (backend REST API, eleven_flash_v2_5, per-coach voice IDs)
- [x] Coach audio playback (TTS MP3 via socket → base64 → browser → earbuds)
- [x] Real preflight checks (camera, mic, speaker, backend, STT token, Gemini token)
- [x] Coaching error surfacing to frontend (coaching-error socket event)
- [x] API key consistency fix (GOOGLE_AI_API_KEY with GEMINI_API_KEY fallback)
- [x] Mode-aware coaching (Gemini adapts to IDLE/APPROACH/CONVERSATION transitions)
- [x] Transcript persistence to MongoDB (user, target, and coach entries)
- [ ] Edge Impulse integration (person detection)
- [ ] Approach mode coaching (triggered by person detection + distance)
- [ ] Comfort check + slap escalation logic

---

## Upcoming

### Epic 4: Sessions & Reports
- [x] Session lifecycle API (start/end)
- [x] Transcript storage in MongoDB (auto-persisted during coaching pipeline)
- [ ] Emotion timeline
- [ ] Post-session Gemini reports

### Remaining Polish
- [ ] Device pairing flow
- [ ] Edge case handling (disconnects, timeouts)
- [x] Desktop layouts (sidebar nav, responsive pages, premium UI)
- [ ] Payment flow (Solana or Stripe)

---

## Development Approach

**Strategy:** Build features first, polish later

1. ✅ Establish design system (consistency foundation)
2. ✅ Build core pages with mobile layout
3. ✅ Build Live Session UI (demo wow-factor)
4. ✅ Connect real AI services (Gemini coaching + ElevenLabs STT/TTS)
5. ✅ Desktop layouts (sidebar nav, responsive pages)
6. ✅ Dark mode theme system (light/dark/system)
7. ⏳ Polish pass (animations, micro-interactions)

**Rationale:** Working demo > beautiful mockup for hackathon judges.

---

## Quick Commands

```bash
# Start development
cd apps/backend && npm run dev    # Backend on :4000
cd apps/frontend && npm run dev   # Frontend on :3000

# Seed database
cd apps/backend && npm run seed

# Type check
npm run type-check
```

---

## Key Files

| File | Purpose |
|------|---------|
| `apps/backend/src/services/aiService.ts` | Gemini 2.0 Flash coaching (init, respond, mode update, end) |
| `apps/backend/src/services/ttsService.ts` | ElevenLabs TTS generation (eleven_flash_v2_5) |
| `apps/backend/src/routes/gemini.ts` | Gemini token endpoint (preflight check) |
| `apps/backend/src/routes/stt.ts` | ElevenLabs Scribe token endpoint |
| `apps/backend/src/sockets/clientHandler.ts` | Socket coaching pipeline (transcript → Gemini → TTS → broadcast) |
| `apps/frontend/src/services/transcriptionService.ts` | ElevenLabs Scribe STT hook (useScribe) |
| `apps/frontend/src/hooks/useSessionSocket.ts` | Socket.io session state + coaching events |
| `apps/frontend/src/hooks/usePreflightChecks.ts` | Device/service validation (camera, mic, backend, STT, Gemini) |
| `apps/frontend/src/pages/LiveSessionPage.tsx` | Live session page (connects STT → socket → coaching) |
| `apps/backend/src/scripts/seed.ts` | Coach seed data (names, prompts, ElevenLabs voice IDs) |
| `apps/backend/src/services/coachGenerationService.ts` | AI coach generation (Gemini profiles + Cloudflare Workers AI avatars) |
| `apps/backend/src/services/preferenceService.ts` | Swipe preference tracking + generation bias |
| `apps/backend/src/config/voicePool.ts` | 30 ElevenLabs voices mapped to personality traits |
| `apps/frontend/src/pages/CoachDiscoveryPage.tsx` | Tinder-style swipe coach discovery |
| `apps/frontend/src/components/coaches/SwipeCard.tsx` | Drag gesture swipe card (Framer Motion) |
| `apps/frontend/src/components/coaches/CoachDetailModal.tsx` | Full coach detail view with hire/save |
| `apps/frontend/src/components/coaches/VoicePreviewButton.tsx` | Tap-to-hear coach voice samples |
| `apps/frontend/src/services/coachService.ts` | Coach generation + roster management API client |
| `apps/frontend/src/hooks/useThemeStore.ts` | Theme state (light/dark/system) with localStorage |
| `apps/frontend/src/hooks/useIsDesktop.ts` | Responsive breakpoint hook (768px) |
| `apps/frontend/src/components/layout/SideNav.tsx` | Desktop sidebar navigation with theme toggle |
| `docs/DESIGN_SYSTEM.md` | Colors, typography, components |
| `docs/github-issues/*.md` | Epic breakdowns |
