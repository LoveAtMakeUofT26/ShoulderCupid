# Cupid 💘

**Your AI Wingman. In Your Ear.**

Real-time AI dating coach via ESP32-CAM smart glasses. Get live coaching during approaches and conversations.

## Current Progress: ~75% Complete

| Phase | Status |
|-------|--------|
| Phase 1: Foundation | ✅ Complete |
| Phase 2: Hardware + Audio Integration | ✅ Core complete (ESP32 hardware pending) |
| Phase 3: AI Coaching Loop | ✅ Core pipeline working |
| Phase 4: Sessions + Reports | 🔧 Partial (lifecycle + transcripts done, reports pending) |
| Phase 5: Polish + Deploy | 🔧 Partial (CI/CD done) |

See [docs/PROGRESS.md](docs/PROGRESS.md) for details.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    WEARABLE RIG                          │
│  ESP32-CAM ──► Streams MJPEG to backend via WiFi        │
│  Ultrasonic ──► Distance to target (TBD)                │
│  Heart Rate ──► Wearer BPM (TBD)                        │
│  Servo ◄────── Slap mechanism (comfort warnings)        │
└───────────────────────┬─────────────────────────────────┘
                        │ WiFi
                        ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND (Vultr Ubuntu VPS)                   │
│  Express API ─► Presage C++ SDK (HR, breathing, HRV)    │
│              ─► Edge Impulse API (person detection)      │
│              ─► Gemini 2.0 Flash (coaching via chat)     │
│              ─► Gemini 2.5 Flash (token gen / preflight) │
│              ─► ElevenLabs TTS (coach audio via REST)    │
│              ─► ElevenLabs Scribe tokens (for client)    │
│              ─► MongoDB Atlas (users, sessions)          │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              BROWSER / FRONTEND (Vercel)                  │
│  React + Vite + TypeScript + Tailwind                    │
│  ElevenLabs Scribe SDK (client-side STT)                 │
│  Audio via Bluetooth earbuds (mic + speaker)             │
│  Landing ─► OAuth ─► Dashboard ─► Preflight ─► Session   │
│  Coach Selection ─► Session History ─► Reports           │
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
| **AI Coaching** | Gemini 2.0 Flash (backend chat sessions) |
| **STT** | ElevenLabs Scribe v2 (client-side real-time) |
| **TTS** | ElevenLabs Flash v2.5 (backend REST API) |
| **Vision** | Edge Impulse (person detection, pending) + Presage C++ (vitals) |
| **Payments** | Solana Pay (Phase 4) |
| **Hardware** | ESP32-CAM + sensors + servo |

---

## Quick Start

```bash
# Install
npm install

# Set up environment
cp .env.example .env
# Edit with your API keys (GOOGLE_AI_API_KEY, ELEVENLABS_API_KEY, etc.)

# Seed database
npm run --workspace=@shoulder-cupid/backend seed

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
│   ├── frontend/          # React + Vite (Vercel)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── layout/      # AppShell, BottomNav, FAB
│   │   │   │   └── session/     # PreflightPage, CoachingPanel, TranscriptStream, etc.
│   │   │   ├── hooks/           # usePreflightChecks, useSessionSocket
│   │   │   ├── pages/           # Dashboard, Coaches, Sessions, LiveSession
│   │   │   └── services/        # API, transcription, audio playback, webcam
│   │   └── tailwind.config.js
│   │
│   └── backend/           # Express + Socket.io (Vultr)
│       └── src/
│           ├── config/       # auth, database
│           ├── models/       # User, Coach, Session
│           ├── routes/       # auth, coaches, user, sessions, stt, gemini, frame
│           ├── services/     # coaching pipeline, Presage SDK
│           ├── sockets/      # WebSocket handlers (coaching, vitals)
│           └── scripts/      # seed.ts
│
├── docs/
│   ├── DESIGN_SYSTEM.md      # Colors, typography, components
│   ├── PLAN.md               # Architecture decisions & data flow
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
| GET | `/api/health` | Server health check (used by preflight) |
| GET | `/api/auth/google` | OAuth redirect |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/coaches` | List coaches |
| PATCH | `/api/user/coach` | Select coach |
| POST | `/api/frame` | Receive JPEG frame (ESP32-CAM or webcam) |
| GET | `/api/stream` | Expose MJPEG stream to frontend |
| POST | `/api/sessions/start` | Start coaching session |
| POST | `/api/sessions/end` | End session |
| GET | `/api/sessions` | List user sessions |
| GET | `/api/sessions/:id` | Session detail |
| GET | `/api/stt/scribe-token` | ElevenLabs Scribe single-use token for client-side STT |
| GET | `/api/gemini/token` | Gemini ephemeral token (used by preflight to verify API key) |
| WS | Socket.io | Real-time events (see Socket Events below) |

### Socket.io Events

| Direction | Event | Description |
|-----------|-------|-------------|
| Client → Server | `join-session` | Join a session room |
| Client → Server | `start-coaching` | Initialize Gemini coaching with selected coach |
| Client → Server | `transcript-input` | Send STT transcript for coaching (text, speaker, isFinal) |
| Client → Server | `end-session` | End the coaching session |
| Server → Client | `coaching-ready` | Coach initialized, includes coachName and voiceId |
| Server → Client | `coaching-update` | Gemini coaching response text |
| Server → Client | `coaching-error` | Coaching pipeline error |
| Server → Client | `coach-audio` | ElevenLabs TTS audio (base64 MP3) |
| Server → Client | `transcript-update` | Persisted transcript entry (user/target/coach) |
| Server → Client | `mode-change` | Mode transition (IDLE/APPROACH/CONVERSATION) |
| Server → Client | `sensors-update` | Distance and heart rate data |
| Server → Client | `emotion-update` | Target emotion detection |
| Server → Client | `target-vitals` | Presage vitals (HR, breathing, HRV) |
| Server → Client | `warning-triggered` | Comfort warning (level 1-3) |

### Coming Soon

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sensors` | Sensor data (distance, HR) |
| GET | `/api/commands` | Command queue for ESP32 (buzz, slap) |

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

## AI Services Integration

### Gemini (Google AI)

Coaching responses are generated **server-side** using Gemini 2.0 Flash chat sessions.

| Component | Package | Model | Location |
|-----------|---------|-------|----------|
| Coaching chat | `@google/generative-ai` | `gemini-2.0-flash` | `apps/backend/src/services/aiService.ts` |
| Token generation | `@google/genai` | `gemini-2.5-flash` | `apps/backend/src/routes/gemini.ts` |

**Env var:** `GOOGLE_AI_API_KEY` (fallback: `GEMINI_API_KEY`)

**Flow:** Frontend STT transcript → Socket.io `transcript-input` → backend `aiService.getCoachingResponse()` → Gemini chat session with mode/emotion/distance context → Socket.io `coaching-update` back to frontend.

The coaching session maintains conversation history per session. System prompt includes the selected coach's personality + current mode (IDLE/APPROACH/CONVERSATION). Responses are capped at 100 tokens for quick earpiece delivery.

### ElevenLabs

| Component | Package | Model | Location |
|-----------|---------|-------|----------|
| STT (Scribe) | `@elevenlabs/react` | `scribe_v2_realtime` | `apps/frontend/src/services/transcriptionService.ts` |
| STT tokens | `@elevenlabs/elevenlabs-js` | N/A | `apps/backend/src/routes/stt.ts` |
| TTS | axios (REST API) | `eleven_flash_v2_5` | `apps/backend/src/services/ttsService.ts` |

**Env var:** `ELEVENLABS_API_KEY`

**STT flow:** Backend generates single-use Scribe token → frontend `useScribe` hook connects with echo cancellation + noise suppression → committed transcripts sent to backend via Socket.io.

**TTS flow:** Backend receives coaching text from Gemini → calls ElevenLabs REST API with coach's voice ID → streams MP3 audio buffer back to frontend via Socket.io `coach-audio` event → browser plays through earbuds.

**Coach voice IDs** (seeded in `apps/backend/src/scripts/seed.ts`):
| Coach | Voice | ElevenLabs ID |
|-------|-------|---------------|
| Smooth Operator | Adam | `pNInz6obpgDQGcFmaJgB` |
| Wingman Chad | Arnold | `VR6AewLTigWG4xSOukaG` |
| Gentle Guide | Bella | `EXAVITQu4vr4xnSDxMaL` |

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
| `VITE_API_URL` | `https://shouldercupid.duckdns.org` |
| `VITE_SOCKET_URL` | `https://shouldercupid.duckdns.org` |

API calls (`/api/*`) are proxied to the Vultr backend via `vercel.json` rewrites.

### Backend (Vultr)

The backend auto-deploys to `shouldercupid.duckdns.org` (`155.138.146.221`) via GitHub Actions when `apps/backend/` or `packages/` change on `main`.

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
BACKEND_URL=https://shoulder-cupid.vercel.app
SESSION_SECRET=<random-secret>
MONGODB_URI=mongodb://localhost:27017/shoulder-cupid
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_AI_API_KEY=<your-gemini-key>
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
