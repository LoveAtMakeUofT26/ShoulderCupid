# Cupid - Software Development Epics

Software-side implementation plan for the AI Dating Coach platform.

## Progress Overview

| Epic | Name | Status | Progress |
|------|------|--------|----------|
| 1 | [Backend Foundation](./epic-1-foundation.md) | ✅ Complete | 5/5 tasks |
| 2 | [Hardware API](./epic-2-hardware-api.md) | ⏳ Pending | 0/5 tasks |
| 3 | [AI Pipeline](./epic-3-ai-pipeline.md) | ⏳ Pending | 0/7 tasks |
| 4 | [Sessions & Reports](./epic-4-sessions.md) | ⏳ Pending | 0/6 tasks |
| 5 | [Frontend Core](./epic-5-frontend-core.md) | ✅ Complete | 7/7 tasks |
| 6 | [Live Session UI](./epic-6-live-session.md) | 🔄 In Progress | 6/8 tasks |
| 7 | [Onboarding](./epic-7-onboarding.md) | ⏳ Pending | 0/8 tasks |
| 8 | [Landing & Payments](./epic-8-landing-payment.md) | ⏳ Pending | 0/10 tasks |

**Total Progress: 18/56 tasks (32%)**

---

## Phase Status

### Phase 1: Foundation ✅
- ✅ Epic 1: Backend Foundation (complete)
- ⏳ Epic 2: Hardware API (pending - waiting for hardware team)
- ✅ Epic 5: Frontend Core (complete)

### Phase 2: Integration
- ⏳ Epic 2: Hardware API - Comfort System
- ⏳ Epic 3: AI Pipeline
- ⏳ Epic 4: Sessions & Reports (backend)

### Phase 3: Full Loop 🔜
- ⏳ Epic 4: Sessions & Reports (frontend)
- 🔜 Epic 6: Live Session UI (next priority)
- ⏳ Epic 7: Onboarding

### Phase 4: Polish
- ⏳ Epic 8: Landing & Payments (Solana)

---

## Development Strategy

**Approach:** Build features first, polish later

```
1. ✅ Design system established
2. ✅ Core pages with mobile layout
3. 🔜 Live Session UI (demo wow-factor)
4. 🔜 Connect AI services (Gemini, ElevenLabs)
5. ⏳ Desktop layouts (stretch)
6. ⏳ Polish pass (animations)
```

---

## Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- MongoDB (Mongoose)
- Passport.js (Google OAuth)
- Socket.io (WebSocket)

**AI Services:**
- Edge Impulse (on-device person detection)
- Presage SDK (emotion analysis)
- ElevenLabs (STT + TTS)
- Gemini API (coaching LLM)

**Frontend:**
- React + Vite + TypeScript
- Tailwind CSS (custom theme)
- React Router
- Socket.io Client

**Payments:**
- Solana Pay (Phase 4)

---

## API Endpoints

### Implemented ✅

```
Auth:
  GET  /api/auth/google          - OAuth redirect
  GET  /api/auth/google/callback - OAuth callback
  GET  /api/auth/me              - Current user + coach
  POST /api/auth/logout          - Logout

Users:
  GET   /api/user/profile        - Get profile
  PATCH /api/user/profile        - Update profile
  PATCH /api/user/coach          - Select coach

Coaches:
  GET /api/coaches               - List coaches
  GET /api/coaches/:id           - Get coach
```

### Pending

```
Hardware:
  POST /api/frame                - Camera frame
  POST /api/sensors              - Sensor data
  GET  /api/commands             - ESP32 command queue
  POST /api/devices/pair         - Device pairing

AI:
  POST /api/audio                - Audio for STT
  POST /api/coach                - Get coaching response

Sessions:
  POST /api/sessions/start       - Start session
  POST /api/sessions/:id/end     - End session
  GET  /api/sessions             - List sessions
  GET  /api/sessions/:id         - Session detail

Payments:
  POST /api/subscribe            - Solana subscription
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Start MongoDB (Docker)
docker compose up -d

# Seed coaches
cd apps/backend && npm run seed

# Start development
npm run dev  # Both frontend + backend
```

---

## Key Documentation

- [PROGRESS.md](../PROGRESS.md) - Current status & next steps
- [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) - Colors, typography, components
