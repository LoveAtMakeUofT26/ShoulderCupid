# Cupid 💘

**Your AI Wingman. In Your Ear.**

Real-time AI dating coach via ESP32-CAM smart glasses. Get live coaching during approaches and conversations.

## Current Progress: ~60% Complete

| Phase | Status |
|-------|--------|
| Phase 1: Foundation | ✅ Complete |
| Phase 2: Hardware + Audio Integration | 🔧 In Progress |
| Phase 3: AI Coaching Loop | ⏳ Pending |
| Phase 4: Sessions + Reports | ⏳ Pending |
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
│              ─► Gemini 2.5 Flash (coaching LLM)          │
│              ─► ElevenLabs TTS (coach audio)             │
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
| GET | `/health` | Server health check (used by preflight) |
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
| GET | `/api/stt/scribe-token` | ElevenLabs Scribe token for client-side STT |
| GET | `/api/gemini/token` | Gemini API key check (preflight) |
| WS | Socket.io | Real-time events (transcript-input, coaching-update, coach-audio, target-vitals) |

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
| `VITE_API_URL` | `http://155.138.146.221:4000` |
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
