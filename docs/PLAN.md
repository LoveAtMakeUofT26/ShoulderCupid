# Cupid - Project Plan

## Architecture Decisions

### Hardware: Single ESP32-CAM (AI Thinker)
- One ESP32-CAM AI Thinker board, mounted on glasses
- Streams MJPEG video over WiFi to the backend
- Backend exposes video stream endpoints for the frontend
- No separate ESP32 controller board (sensors TBD - may go through phone/browser)

### Edge Impulse: Runs on Backend
- Person detection model (male/female/none) runs server-side, not on-device
- Backend receives frames from ESP32-CAM, forwards to Edge Impulse API
- Keeps ESP32-CAM firmware simple (just stream video)

### Presage SDK: Runs on Vultr (Ubuntu)
- C++ SDK runs natively on the Vultr Ubuntu server
- Emotion analysis on camera frames during conversation mode
- No Python wrapper needed - direct C++ integration

### Audio: Browser-Based (Not ESP32)
- ESP32 mic doesn't work well enough for conversation capture
- The device running the website/server handles all audio
- Browser requests microphone permissions (Web Audio API)
- User wears Bluetooth earbuds for both input and output
- STT flow: Browser mic -> ElevenLabs Scribe (client-side SDK, token from backend) -> transcript
- Coaching flow: Transcript -> WebSocket (`transcript-input`) -> Backend -> Gemini -> coaching response + TTS audio
- TTS flow: Backend (ElevenLabs TTS) -> WebSocket (`coach-audio`) -> browser -> Bluetooth earbuds

### Pre-flight Checks (Real)
- Full-page setup UI with real device/service validation before session
- Camera: `getUserMedia({ video })` with live preview
- Microphone: `getUserMedia({ audio })` with volume meter
- Speaker: `enumerateDevices()` checking `audiooutput`
- Backend: `GET /health` with 5s timeout
- STT: `GET /api/stt/scribe-token` with 10s timeout
- AI Coach: `GET /api/gemini/token` with 10s timeout
- All 6 checks run in parallel, per-check retry on failure
- I/O configuration (camera source, audio devices) integrated into preflight

### Hosting
- **Backend**: Vultr Ubuntu VPS (Edge Impulse + Presage C++ + Express API)
- **Frontend**: Vercel (React + Vite)
- **Database**: MongoDB Atlas

---

## System Architecture (Updated)

```
┌──────────────────────────────────────────────────────────┐
│                   WEARABLE RIG                            │
│                                                           │
│  ESP32-CAM (AI Thinker)                                  │
│  ├── OV2640 camera                                       │
│  ├── WiFi -> streams MJPEG to backend                    │
│  └── That's it. Just video.                              │
│                                                           │
│  Servo/Motor (slap mechanism)                            │
│  ├── Triggered by backend commands                       │
│  └── Connected to ESP32-CAM GPIO or separate MCU         │
│                                                           │
│  Ultrasonic sensor (distance)                            │
│  Heart rate sensor (wearer BPM)                          │
│  └── TBD: ESP32-CAM GPIO or phone-based                 │
└──────────────────────┬───────────────────────────────────┘
                       │ WiFi
                       ▼
┌──────────────────────────────────────────────────────────┐
│              BACKEND (Vultr Ubuntu VPS)                    │
│                                                           │
│  Express API Server                                      │
│  ├── Receives MJPEG stream from ESP32-CAM                │
│  ├── Exposes video stream endpoints to frontend          │
│  ├── Edge Impulse API (person detection)                 │
│  ├── Presage C++ SDK (emotion analysis)                  │
│  ├── ElevenLabs STT token endpoint (/api/stt)            │
│  ├── Gemini Live token endpoint (/api/gemini)            │
│  ├── ElevenLabs TTS (coaching text -> audio)             │
│  ├── Command queue (buzz/slap -> ESP32)                  │
│  └── MongoDB (users, sessions, transcripts)              │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│              BROWSER / FRONTEND (Vercel)                   │
│                                                           │
│  React + Vite + TypeScript + Tailwind                    │
│  ├── ElevenLabs Scribe SDK (client-side STT)             │
│  ├── Gemini Live SDK (client-side coaching)              │
│  ├── Captures audio from Bluetooth earbuds               │
│  ├── Receives TTS audio from backend -> plays to earbuds │
│  ├── Displays live video feed from backend endpoints     │
│  ├── Live session dashboard (transcript, emotions, HR)   │
│  ├── Coach selection, session history, reports           │
│  └── OAuth login (Google)                                │
└──────────────────────────────────────────────────────────┘
```

---

## Data Flow - One Complete Loop

```
1. ESP32-CAM captures frames
   └─► Streams MJPEG to backend over WiFi

2. Backend receives frames
   ├─► Edge Impulse API: person_male / person_female / no_person
   └─► If person detected + close enough: Presage C++ SDK -> emotion

3. Browser captures audio (Bluetooth earbuds mic)
   └─► ElevenLabs Scribe SDK (client-side, token from /api/stt)
   └─► Real-time partial + committed transcripts

4. Transcripts sent to backend via WebSocket (transcript-input event)
   └─► Backend forwards to Gemini for coaching response
   └─► Coaching text sent back via WebSocket (coaching-update event)

5. Backend assembles coaching context
   {
     person_detected, gender, distance_cm,
     heart_rate_bpm, target_emotion,
     transcript, conversation_history,
     coach_personality
   }

6. ElevenLabs TTS converts coaching text to audio on backend
   └─► Audio sent via WebSocket (coach-audio event) -> browser -> earbuds

7. Comfort check (conversation mode only)
   └─► Presage detects discomfort
       ├── Warning 1: buzz command -> ESP32
       ├── Warning 2: slap command -> ESP32
       └── Warning 3: continuous slap + "ABORT MISSION" audio

8. Session ends
   └─► Gemini generates report
   └─► Saved to MongoDB
   └─► Available on dashboard
```

---

## Coaching Phases

```
[IDLE] ──person detected──► [APPROACH MODE]
                                │
                                │  Active: Edge Impulse, sensors
                                │  Coach: hype, approach tips, openers
                                │  Audio: TTS only (no conversation yet)
                                │
                          distance < 150cm
                                │
                                ▼
                          [CONVERSATION MODE]
                                │
                                │  Active: ALL (Presage, STT, emotion, slap)
                                │  Coach: real-time conversation guidance
                                │  Audio: STT (earbuds mic) + TTS (earbuds output)
                                │
                          person lost / session ended
                                │
                                ▼
                             [REPORT]
```

---

## Backend Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check (used by preflight) |

### ESP32 Hardware
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/frame` | Receive JPEG frame (ESP32-CAM or webcam) |
| GET | `/api/stream` | Expose MJPEG stream to frontend |
| POST | `/api/sensors` | Receive sensor data (distance, HR) |
| GET | `/api/commands` | Command queue for ESP32 (buzz, slap) |

### AI Pipeline
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stt/scribe-token` | ElevenLabs Scribe single-use token for client-side STT |
| GET | `/api/gemini/token` | Gemini token (used by preflight check + backend coaching) |
| WS | Socket.io | Real-time session data (transcript-input, coaching-update, coach-audio, target-vitals) |

### Auth & Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | OAuth redirect |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/coaches` | List coaches |
| PATCH | `/api/user/coach` | Select coach |

### Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions/start` | Start coaching session |
| POST | `/api/sessions/end` | End session, generate report |
| GET | `/api/sessions` | List user sessions |
| GET | `/api/sessions/:id` | Session detail + report |

---

## AI Services

| Service | Purpose | Runs Where |
|---------|---------|------------|
| **Edge Impulse** | Person detection (male/female/none) | Backend (API call) |
| **Presage SDK** | Emotion analysis from face | Backend (C++ native on Ubuntu) |
| **ElevenLabs Scribe** | Real-time speech-to-text | Frontend (client-side SDK, token from backend) |
| **ElevenLabs TTS** | Coaching text to speech | Backend (API call) |
| **Gemini 2.5 Flash** | Real-time coaching from transcript | Backend (via coaching pipeline, triggered by WebSocket) |

---

## Hardware Parts

| Part | Purpose | Notes |
|------|---------|-------|
| ESP32-CAM (AI Thinker) | Camera + WiFi video stream | Only hardware board needed for MVP |
| Servo (SG90) | Slap mechanism | Connected to ESP32-CAM GPIO or separate MCU |
| Vibration motor | Warning buzz | Same |
| Ultrasonic (HC-SR04) | Distance measurement | TBD: ESP32-CAM or phone |
| Heart rate (MAX30102) | Wearer BPM | TBD: ESP32-CAM or phone |
| Bluetooth earbuds | Audio I/O for conversation | Paired to user's phone/laptop running the site |
| Glasses frame | Mount for ESP32-CAM | Physical build |
| LiPo battery | Power ESP32-CAM | 3.7V with regulator |

---

## Build Phases

### Phase 1: Foundation (DONE)
- [x] Express backend with TypeScript
- [x] MongoDB connection (Atlas)
- [x] Google OAuth
- [x] Coach CRUD + seed data
- [x] React frontend scaffold
- [x] Mobile app shell + design system
- [x] Dashboard, Coaches, Sessions pages
- [x] Onboarding wizard
- [x] Marketing landing page

### Phase 2: Hardware + Audio Integration (CURRENT)
- [x] Frame ingestion endpoint (`POST /api/frame`)
- [x] Configurable camera source (webcam or ESP32-CAM)
- [x] Webcam frame capture (2 FPS, JPEG)
- [x] Frame buffer + MP4 stitching via ffmpeg
- [x] Presage C++ SDK integration (HR, breathing, HRV)
- [x] Target vitals panel in live session UI
- [x] Browser audio capture (mic permissions via ElevenLabs Scribe SDK)
- [x] ElevenLabs STT integration (client-side Scribe + backend token)
- [x] Backend coaching pipeline (transcript -> Gemini -> coach-audio TTS)
- [x] Real preflight checks (camera, mic, speaker, backend, STT, AI)
- [ ] ESP32-CAM streaming MJPEG to backend (hardware pending)
- [ ] Edge Impulse person detection on backend

### Phase 3: AI Coaching Loop
- [x] Backend coaching pipeline (transcript-input -> Gemini -> coaching-update + coach-audio)
- [ ] Full coaching context (person detection, emotion, coach personality)
- [ ] Approach mode (person detected, far away)
- [ ] Conversation mode (close, STT active)
- [ ] Coach personality system (prompt variations)
- [ ] Comfort check + slap escalation logic
- [ ] Command queue (buzz/slap -> ESP32)

### Phase 4: Sessions + Reports
- [x] Session lifecycle (start/end API)
- [x] Sessions frontend connected to backend API
- [ ] Transcript storage in MongoDB
- [ ] Emotion timeline tracking
- [ ] Post-session Gemini report generation
- [ ] Session detail view with report

### Phase 5: Polish + Deploy
- [x] Deploy backend to Vultr (GitHub Actions CI/CD)
- [x] Deploy frontend to Vercel (auto-deploy)
- [ ] Payment flow (Solana or Stripe)
- [ ] Edge case handling (disconnects, timeouts)
- [ ] Demo video

---

## Key Technical Notes

1. **ESP32-CAM is dumb**: It only streams video. All intelligence is on the backend.
2. **Browser is the audio device**: No ESP32 audio. User's phone/laptop with Bluetooth earbuds handles mic input and coaching audio output.
3. **STT and Gemini run client-side**: ElevenLabs Scribe and Gemini Live use client-side SDKs with backend-issued tokens. This avoids streaming raw audio through the server and reduces latency.
4. **Presage needs Ubuntu**: C++ SDK won't run on macOS easily. Vultr Ubuntu VPS is the target.
5. **Edge Impulse is server-side**: No TinyML on ESP32-CAM. Cloud API keeps firmware simple.
6. **Two connections to ESP32**: Backend pulls video frames; backend pushes commands (buzz/slap).
7. **New env vars needed**: `ELEVENLABS_API_KEY` (for Scribe tokens), `GOOGLE_AI_API_KEY` (for Gemini tokens).
