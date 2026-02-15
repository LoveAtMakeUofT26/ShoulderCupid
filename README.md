# Cupid

**Your AI Wingman. In Your Ear.**

Real-time AI dating coach via ESP32-CAM smart glasses. Get live coaching during approaches and conversations.

## Current Progress: ~65% Complete

| Phase | Status |
|-------|--------|
| Phase 1: Foundation | Done |
| Phase 2: Integration | Done |
| Phase 3: AI Pipeline | Done |
| Phase 4: Sessions | Done |
| Phase 5: Polish | In Progress |

See [docs/PROGRESS.md](docs/PROGRESS.md) for details.

---

## Architecture

```
                    WEARABLE RIG
  ESP32-CAM ──> WiFi ──> Backend (video frames)
  Ultrasonic ──> Distance to target
  Heart Rate ──> Wearer BPM
  Servo <────── Slap mechanism (comfort warnings)
                        |
                        v
                   CLOUD BACKEND (Express + Socket.io)
  Gemini 2.0 Flash ── Coaching LLM (with coach system prompt)
  ElevenLabs ──────── STT (Scribe, client-side) + TTS (Flash v2.5, server-side)
  Presage SDK ─────── Emotion analysis (C++ on Vultr)
  MongoDB ─────────── Users, sessions, transcripts
                        |
                        v
                  REACT FRONTEND (Vite + Tailwind)
  Landing ─> OAuth ─> Dashboard ─> Live Session
  Coach Selection ─> Session History ─> Reports
  ElevenLabs Scribe SDK (client-side STT via browser mic)
  Audio playback (coach TTS via browser speakers/earbuds)
```

---

## AI Pipeline Flow

```
1. Browser mic captures audio
   └─> ElevenLabs Scribe (client-side SDK, token from /api/stt/scribe-token)
   └─> Real-time partial + committed transcripts

2. Committed transcript sent to backend via Socket.io
   └─> transcript-input event

3. Backend orchestrates:
   ├─> Gemini 2.0 Flash (with coach system_prompt + mode context)
   │   └─> Coaching response text (1-2 sentences max)
   ├─> coaching-update event ──> frontend CoachingPanel (instant text)
   ├─> transcript-update event ──> frontend TranscriptStream
   └─> ElevenLabs TTS (Flash v2.5, coach voice_id)
       └─> coach-audio event ──> frontend audio playback queue

4. Browser plays coach audio through speakers/earbuds
```

---

## Coaching Modes

```
[IDLE] ──person detected──> [APPROACH MODE]
                                |
                                |  "Alright king, she's 3m ahead.
                                |   Walk over casual."
                                |
                          distance < 150cm
                                |
                                v
                          [CONVERSATION MODE]
                                |
                                |  "She's smiling. Ask about
                                |   her weekend."
                                |
                          session ended
                                |
                                v
                             [REPORT]
```

Without ESP32 hardware, sessions auto-promote to CONVERSATION mode.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React + Vite + TypeScript + Tailwind |
| **Backend** | Node.js + Express + Socket.io |
| **Database** | MongoDB Atlas |
| **Auth** | Google OAuth (Passport.js) |
| **AI Coaching** | Gemini 2.0 Flash (backend, `@google/generative-ai`) |
| **STT** | ElevenLabs Scribe v2 Realtime (client-side, `@elevenlabs/react`) |
| **TTS** | ElevenLabs Flash v2.5 (backend REST API) |
| **Vision** | Edge Impulse + Presage SDK (future) |
| **Hardware** | ESP32-CAM + sensors + servo |

---

## Quick Start

```bash
# Install
npm install

# Set up environment
cp .env.example apps/backend/.env
# Edit apps/backend/.env with your API keys (GEMINI_API_KEY, ELEVENLABS_API_KEY, etc.)

# Seed database with coaches
cd apps/backend && npx tsx src/scripts/seed.ts && cd ../..

# Run development (starts both frontend and backend)
npm run dev
```

**URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

---

## Project Structure

```
cupid/
├── apps/
│   ├── frontend/          # React + Vite
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── layout/     # AppShell, BottomNav, FAB
│   │   │   │   └── session/    # CoachingPanel, TranscriptStream, StatsBar
│   │   │   ├── hooks/          # useSessionSocket
│   │   │   ├── pages/          # Dashboard, Coaches, Sessions, LiveSession
│   │   │   └── services/       # auth, transcriptionService, audioPlaybackService
│   │   └── vite.config.ts      # Proxy /api + /socket.io to backend
│   │
│   ├── backend/           # Express + Socket.io
│   │   └── src/
│   │       ├── config/       # auth (Passport), database (MongoDB)
│   │       ├── models/       # User, Coach, Session
│   │       ├── routes/       # auth, coaches, user, sessions, hardware, stt, gemini
│   │       ├── services/     # aiService (Gemini), ttsService (ElevenLabs), presageMetrics
│   │       ├── sockets/      # clientHandler (coaching pipeline), esp32Handler
│   │       └── scripts/      # seed.ts
│   │
│   └── marketing/         # Landing page (separate Vite app)
│
├── docs/
│   ├── PLAN.md               # Architecture decisions
│   ├── PROGRESS.md           # Current status
│   ├── DESIGN_SYSTEM.md      # Colors, typography, components
│   └── github-issues/        # Epic breakdowns
│
└── .env.example              # Environment variable template
```

---

## Coaches

| Coach | Personality | Voice |
|-------|-------------|-------|
| Smooth Operator | Confident & playful | Adam (ElevenLabs) |
| Wingman Chad | Hype man energy | Arnold (ElevenLabs) |
| Gentle Guide | Calm & supportive | Bella (ElevenLabs) |

---

## API Endpoints

### Auth & Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | OAuth redirect |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/coaches` | List coaches |
| PATCH | `/api/user/coach` | Select coach |
| PATCH | `/api/user/onboarding` | Complete onboarding |

### Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions/start` | Start coaching session |
| POST | `/api/sessions/:id/end` | End session |
| GET | `/api/sessions` | List user sessions |
| GET | `/api/sessions/:id` | Session detail |

### AI / Tokens
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stt/scribe-token` | ElevenLabs Scribe token (client-side STT) |
| GET | `/api/gemini/token` | Gemini ephemeral token (legacy, unused) |

### Hardware (ESP32)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/frame` | Receive JPEG frame from ESP32-CAM |
| POST | `/api/sensors` | Receive sensor data (distance, HR) |
| GET | `/api/commands` | Command queue for ESP32 (buzz, slap) |
| POST | `/api/trigger-warning` | Trigger warning on session |
| POST | `/api/devices/pair` | Pair ESP32 device |

### Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `identify` | Client -> Server | Identify as web-client or esp32 |
| `join-session` | Client -> Server | Join a session room |
| `start-coaching` | Client -> Server | Initialize Gemini coaching with coach |
| `transcript-input` | Client -> Server | Send committed transcript for coaching |
| `end-session` | Client -> Server | End session and cleanup |
| `session-state` | Server -> Client | Initial session state on join |
| `mode-change` | Server -> Client | Coaching mode changed |
| `coaching-ready` | Server -> Client | Coach initialized, ready for input |
| `coaching-update` | Server -> Client | New coaching text from Gemini |
| `transcript-update` | Server -> Client | New transcript entry (user/coach) |
| `coach-audio` | Server -> Client | Base64 mp3 audio from ElevenLabs TTS |
| `sensors-update` | Server -> Client | Updated sensor data |
| `emotion-update` | Server -> Client | Detected emotion from Presage |
| `warning-triggered` | Server -> Client | Warning alert (level 1-3) |

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

## Deployment

### Frontend (Vercel)

The frontend auto-deploys to [shoulder-cupid.vercel.app](https://shoulder-cupid.vercel.app) on push to `main`.

**Vercel project settings:**
- Framework Preset: Vite
- Root Directory: `apps/frontend`
- Build Command: `cd ../.. && npx turbo run build --filter=@shoulder-cupid/frontend`
- Output Directory: `dist`

**Vercel environment variables:**
| Variable | Value |
|---|---|
| `VITE_SOCKET_URL` | `http://155.138.146.221:4000` |

API calls (`/api/*`) are proxied to the Vultr backend via `vercel.json` rewrites.

### Backend (Vultr)

The backend auto-deploys to `155.138.146.221` via GitHub Actions when `apps/backend/` or `packages/` change on `main`.

**Required GitHub Actions secrets** (Settings > Secrets and variables > Actions):
| Secret | Value |
|---|---|
| `VULTR_HOST` | Server IP |
| `VULTR_USER` | SSH username (e.g. `root`) |
| `VULTR_SSH_KEY` | Private SSH key for the server |
| `VULTR_APP_PATH` | `/opt/cupid` |

**Backend `.env` on Vultr** (`/opt/cupid/apps/backend/.env`):
```
NODE_ENV=production
FRONTEND_URL=https://shoulder-cupid.vercel.app
SESSION_SECRET=<random-secret>
MONGODB_URI=mongodb://localhost:27017/shoulder-cupid
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GEMINI_API_KEY=<your-gemini-key>
ELEVENLABS_API_KEY=<your-elevenlabs-key>
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) > APIs & Services > Credentials
2. Under **Authorized JavaScript origins**, add:
   - `https://shoulder-cupid.vercel.app`
   - `http://localhost:3000` (for local dev)
3. Under **Authorized redirect URIs**, add:
   - `https://shoulder-cupid.vercel.app/api/auth/google/callback`
   - `http://localhost:4000/api/auth/google/callback` (for local dev)

### Manual Backend Deploy

If GitHub Actions isn't set up yet:
```bash
ssh root@155.138.146.221
cd /opt/cupid
git pull origin main
cd apps/backend
npm install
npm run build
pm2 restart all
```

---

## License

MIT
