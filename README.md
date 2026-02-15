# Cupid 💘

**Your AI Wingman. In Your Ear.**

Real-time AI dating coach via ESP32-CAM smart glasses. Get live coaching during approaches and conversations.

## Current Progress: 32% Complete

| Phase | Status |
|-------|--------|
| Phase 1: Foundation | ✅ Complete |
| Phase 2: Integration | 🔜 In Progress |
| Phase 3: Full Loop | ⏳ Pending |
| Phase 4: Polish | ⏳ Pending |

See [docs/PROGRESS.md](docs/PROGRESS.md) for details.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    WEARABLE RIG                          │
│  ESP32-CAM ──► Edge Impulse (person detection)          │
│  Ultrasonic ──► Distance to target                      │
│  Heart Rate ──► Wearer BPM                              │
│  Servo ◄────── Slap mechanism (comfort warnings)        │
└───────────────────────┬─────────────────────────────────┘
                        │ WiFi
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   CLOUD BACKEND                          │
│  Express API ─► Presage SDK (emotion analysis)          │
│              ─► ElevenLabs (STT + TTS)                  │
│              ─► Gemini API (coaching LLM)               │
│              ─► MongoDB (users, sessions)               │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  REACT FRONTEND                          │
│  Landing ─► OAuth ─► Dashboard ─► Live Session          │
│  Coach Selection ─► Session History ─► Reports          │
└─────────────────────────────────────────────────────────┘
```

---

## Coaching Modes

```
[IDLE] ──person detected──► [APPROACH MODE]
                                │
                                │  "Alright king, she's 3m ahead.
                                │   Walk over casual."
                                │
                          distance < 150cm
                                │
                                ▼
                          [CONVERSATION MODE]
                                │
                                │  "She's smiling. Ask about
                                │   her weekend."
                                │
                          session ended
                                │
                                ▼
                             [REPORT]
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React + Vite + TypeScript + Tailwind |
| **Backend** | Node.js + Express + Socket.io |
| **Database** | MongoDB Atlas |
| **Auth** | Google OAuth (Passport.js) |
| **AI** | Gemini API + ElevenLabs + Edge Impulse + Presage |
| **Payments** | Solana Pay (Phase 4) |
| **Hardware** | ESP32-CAM + sensors + servo |

---

## Quick Start

```bash
# Install
npm install

# Set up environment
cp apps/backend/.env.example apps/backend/.env
# Edit with your API keys

# Seed database
npm run --workspace=@shoulder-cupid/backend seed

# Run development (starts both frontend and backend)
npm run dev
```

**URLs:**
- Frontend: http://localhost:3005
- Backend: http://localhost:4005

---

## Project Structure

```
cupid/
├── apps/
│   ├── frontend/          # React + Vite
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── layout/   # AppShell, BottomNav, FAB
│   │   │   ├── pages/        # Dashboard, Coaches, Sessions
│   │   │   └── services/     # API calls
│   │   └── tailwind.config.js
│   │
│   └── backend/           # Express + Socket.io
│       └── src/
│           ├── config/       # auth, database
│           ├── models/       # User, Coach, Session
│           ├── routes/       # auth, coaches, user, sessions
│           ├── sockets/      # WebSocket handlers
│           └── scripts/      # seed.ts
│
├── docs/
│   ├── DESIGN_SYSTEM.md      # Colors, typography, components
│   ├── PROGRESS.md           # Current status
│   └── github-issues/        # Epic breakdowns
│
└── firmware/              # ESP32 code (C++)
```

---

## Coaches

| Coach | Personality | Style |
|-------|-------------|-------|
| 💘 Smooth Operator | Confident & playful | Cool, suave, witty |
| 🔥 Wingman Chad | Hype man energy | High energy, bro vibes |
| 🌸 Gentle Guide | Calm & supportive | Soft, anxiety-reducing |

---

## API Endpoints

### Implemented ✅

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | OAuth redirect |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/coaches` | List coaches |
| PATCH | `/api/user/coach` | Select coach |

### Coming Soon

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/frame` | Camera frame from ESP32 |
| POST | `/api/sensors` | Sensor data |
| GET | `/api/commands` | Command queue for ESP32 |
| POST | `/api/sessions/start` | Start session |
| POST | `/api/coach` | Get coaching response |

---

## Design System

See [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)

**Colors:**
- Cupid Pink: `#E8566C`
- Gold: `#C9A962`
- Marble: `#FAF7F5`

**Typography:**
- Headings: Playfair Display
- Body: Inter

---

## License

MIT
