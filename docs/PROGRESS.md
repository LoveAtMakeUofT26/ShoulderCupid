# Cupid - Development Progress

## Current Status: Phase 2 In Progress 🔄

Foundation complete. Live session UI with real preflight checks, Presage vitals, and backend coaching pipeline integrated.

---

## Completed

### Epic 1: Backend Foundation ✅
- [x] Express API server with TypeScript
- [x] MongoDB connection (Atlas)
- [x] Google OAuth authentication
- [x] Coach CRUD API + seed data (3 coaches)
- [x] User profile & coach selection API

### Epic 5: Frontend Core ✅
- [x] React + Vite + TypeScript scaffold
- [x] Tailwind with custom design system
- [x] Mobile app shell (BottomNav, AppShell, FAB)
- [x] Authentication flow (Google OAuth)
- [x] Dashboard page with coach card
- [x] Coaches page with selection
- [x] Sessions page with backend API
- [x] Settings page (placeholder)

### Design System ✅
- [x] Color palette (Cupid pink, gold, marble)
- [x] Typography (Playfair Display + Inter)
- [x] Component styles (buttons, cards, nav)
- [x] Mobile-first layouts

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

### Epic 3: AI Pipeline 🔄
- [x] ElevenLabs STT (client-side Scribe SDK + backend token)
- [x] Backend coaching pipeline (transcript → socket → Gemini → coach response)
- [x] Coach audio playback (TTS audio via socket → browser → earbuds)
- [x] Real preflight checks (camera, mic, speaker, backend, STT, AI)
- [ ] Edge Impulse integration (person detection)
- [ ] Full coaching context (person detection, emotion, coach personality)
- [ ] Approach mode coaching
- [ ] Comfort check + slap escalation logic

---

## Upcoming

### Epic 4: Sessions & Reports
- [x] Session lifecycle API (start/end)
- [ ] Transcript storage in MongoDB
- [ ] Emotion timeline
- [ ] Post-session Gemini reports

### Remaining Polish
- [ ] Device pairing flow
- [ ] Edge case handling (disconnects, timeouts)
- [ ] Desktop layouts (stretch goal)
- [ ] Payment flow (Solana or Stripe)

---

## Development Approach

**Strategy:** Build features first, polish later

1. ✅ Establish design system (consistency foundation)
2. ✅ Build core pages with mobile layout
3. ✅ Build Live Session UI (demo wow-factor)
4. 🔄 Connect real AI services
5. ⏳ Desktop layouts (stretch goal)
6. ⏳ Polish pass (animations, micro-interactions)

**Rationale:** Working demo > beautiful mockup for hackathon judges.

---

## Quick Commands

```bash
# Start development
cd apps/backend && npm run dev    # Backend on :4005
cd apps/frontend && npm run dev   # Frontend on :3005

# Seed database
cd apps/backend && npm run seed

# Type check
npm run type-check
```

---

## Key Files

| File | Purpose |
|------|---------|
| `docs/DESIGN_SYSTEM.md` | Colors, typography, components |
| `docs/github-issues/*.md` | Epic breakdowns |
| `apps/backend/src/scripts/seed.ts` | Coach seed data |
| `apps/frontend/src/components/layout/` | AppShell, BottomNav, FAB |
| `apps/frontend/src/components/session/PreflightPage.tsx` | Real preflight checks + I/O setup |
| `apps/frontend/src/hooks/usePreflightChecks.ts` | Device/service validation hook |
| `apps/frontend/tailwind.config.js` | Custom theme |
