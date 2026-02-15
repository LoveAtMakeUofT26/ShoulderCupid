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
- Coaching flow: Transcript -> Socket.io -> Backend Gemini 2.0 Flash (with coach system_prompt) -> coaching text
- TTS flow: Backend ElevenLabs TTS (Flash v2.5) -> base64 mp3 via Socket.io -> browser audio playback

### Hosting
- **Backend**: Vultr Ubuntu VPS (Edge Impulse + Presage C++ + Express API)
- **Frontend**: Vercel (React + Vite)
- **Database**: MongoDB Atlas

---

## System Architecture

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
                       v
┌──────────────────────────────────────────────────────────┐
│              BACKEND (Vultr Ubuntu VPS)                    │
│                                                           │
│  Express API Server + Socket.io                          │
│  ├── Receives MJPEG frames from ESP32-CAM                │
│  ├── Edge Impulse API (person detection) [future]        │
│  ├── Presage C++ SDK (emotion analysis) [future]         │
│  ├── ElevenLabs STT token endpoint (/api/stt)            │
│  ├── Gemini 2.0 Flash (coaching LLM with system prompt)  │
│  ├── ElevenLabs TTS Flash v2.5 (coaching text -> audio)  │
│  ├── Socket pipeline (orchestrates coaching loop)        │
│  ├── Command queue (buzz/slap -> ESP32)                  │
│  └── MongoDB (users, sessions, transcripts)              │
└──────────────────────┬───────────────────────────────────┘
                       │
                       v
┌──────────────────────────────────────────────────────────┐
│              BROWSER / FRONTEND (Vercel)                   │
│                                                           │
│  React + Vite + TypeScript + Tailwind                    │
│  ├── ElevenLabs Scribe SDK (client-side STT)             │
│  ├── Sends transcripts to backend via Socket.io          │
│  ├── Receives coaching text + audio from backend         │
│  ├── Audio playback queue (coach TTS via earbuds)        │
│  ├── Displays live video feed from ESP32 or webcam       │
│  ├── Live session dashboard (transcript, coaching, HR)   │
│  ├── Coach selection, session history, reports           │
│  └── OAuth login (Google)                                │
└──────────────────────────────────────────────────────────┘
```

---

## Data Flow - One Complete Loop

```
1. ESP32-CAM captures frames
   └─> Streams MJPEG to backend over WiFi

2. Backend receives frames
   ├─> Edge Impulse API: person_male / person_female / no_person [future]
   └─> If person detected + close enough: Presage C++ SDK -> emotion [future]

3. Browser captures audio (Bluetooth earbuds mic)
   └─> ElevenLabs Scribe SDK (client-side, token from /api/stt/scribe-token)
   └─> Real-time partial + committed transcripts

4. Committed transcripts sent to backend via Socket.io (transcript-input event)
   └─> Backend Gemini 2.0 Flash (with coach system_prompt + mode context)
   └─> Returns 1-2 sentence coaching response

5. Backend broadcasts coaching text to frontend via Socket.io
   ├─> coaching-update event -> CoachingPanel
   └─> transcript-update event -> TranscriptStream

6. Backend generates TTS audio via ElevenLabs Flash v2.5
   └─> coach-audio event (base64 mp3) -> browser audio playback queue
   └─> User hears coach via earbuds

7. Comfort check (conversation mode only) [future]
   └─> Presage detects discomfort
       ├── Warning 1: buzz command -> ESP32
       ├── Warning 2: slap command -> ESP32
       └── Warning 3: continuous slap + "ABORT MISSION" audio

8. Session ends
   └─> Gemini generates report [future]
   └─> Saved to MongoDB
   └─> Available on dashboard
```

---

## Coaching Phases

```
[IDLE] ──person detected──> [APPROACH MODE]
                                │
                                │  Active: Edge Impulse, sensors
                                │  Coach: hype, approach tips, openers
                                │  Audio: TTS only (no conversation yet)
                                │
                          distance < 150cm
                                │
                                v
                          [CONVERSATION MODE]
                                │
                                │  Active: ALL (Presage, STT, emotion, slap)
                                │  Coach: real-time conversation guidance
                                │  Audio: STT (earbuds mic) + TTS (earbuds output)
                                │
                          person lost / session ended
                                │
                                v
                             [REPORT]
```

Without ESP32 hardware connected, sessions auto-promote from IDLE to CONVERSATION mode when coaching starts.

---

## Backend Endpoints

### ESP32 Hardware
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/frame` | Receive JPEG frame from ESP32-CAM |
| POST | `/api/sensors` | Receive sensor data (distance, HR) |
| GET | `/api/commands` | Command queue for ESP32 (buzz, slap) |
| POST | `/api/trigger-warning` | Trigger warning on session |
| POST | `/api/devices/pair` | Pair ESP32 device |

### AI Pipeline
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stt/scribe-token` | ElevenLabs Scribe single-use token for client-side STT |
| GET | `/api/gemini/token` | Gemini ephemeral token (legacy) |

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

---

## AI Services

| Service | Purpose | Runs Where |
|---------|---------|------------|
| **ElevenLabs Scribe** | Real-time speech-to-text | Frontend (client-side SDK, token from backend) |
| **Gemini 2.0 Flash** | Coaching LLM (with coach system_prompt + mode context) | Backend (`@google/generative-ai`) |
| **ElevenLabs TTS** | Coaching text to speech (Flash v2.5) | Backend (REST API, audio sent via Socket.io) |
| **Edge Impulse** | Person detection (male/female/none) | Backend (API call) [future] |
| **Presage SDK** | Emotion analysis from face | Backend (C++ native on Ubuntu) [future] |

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

### Phase 2: Hardware + Audio Integration (DONE)
- [x] Hardware API endpoints (frame, sensors, commands, pairing)
- [x] Browser audio capture (mic permissions via ElevenLabs Scribe SDK)
- [x] ElevenLabs STT integration (client-side Scribe + backend token endpoint)
- [x] ElevenLabs TTS integration (backend Flash v2.5 + audio playback on frontend)
- [ ] ESP32-CAM streaming MJPEG to backend (blocked on hardware)
- [ ] Edge Impulse person detection on backend
- [ ] Presage C++ SDK on Vultr Ubuntu

### Phase 3: AI Coaching Loop (DONE)
- [x] Gemini coaching on backend with coach system_prompt + mode context
- [x] Socket.io pipeline: transcript -> Gemini -> TTS -> audio
- [x] Mode-aware coaching (IDLE/APPROACH/CONVERSATION)
- [x] Auto-promote to CONVERSATION when no hardware connected
- [x] Coach personality system (3 coaches with unique prompts + voices)
- [ ] Comfort check + slap escalation logic (needs hardware)
- [ ] Command queue to ESP32 (needs hardware)

### Phase 4: Sessions + Reports (PARTIALLY DONE)
- [x] Session lifecycle (start/end)
- [x] Transcript storage in MongoDB
- [x] Session history + detail pages
- [ ] Post-session Gemini report generation
- [ ] Emotion timeline tracking

### Phase 5: Polish + Deploy (IN PROGRESS)
- [x] Onboarding wizard (profile, quiz, coach recommendation)
- [x] Marketing landing page
- [ ] Payment flow (Solana or Stripe)
- [ ] Deploy backend to Vultr
- [ ] Deploy frontend to Vercel
- [ ] Edge case handling (disconnects, timeouts)
- [ ] Demo video

---

## Key Technical Notes

1. **ESP32-CAM is dumb**: It only streams video. All intelligence is on the backend.
2. **Browser is the audio device**: No ESP32 audio. User's phone/laptop with Bluetooth earbuds handles mic input and coaching audio output.
3. **STT runs client-side, Gemini runs server-side**: ElevenLabs Scribe uses a client-side SDK with a backend-issued token. Gemini coaching runs on the backend to inject coach system_prompt, keep API keys secure, and include mode/sensor context.
4. **Presage needs Ubuntu**: C++ SDK won't run on macOS easily. Vultr Ubuntu VPS is the target.
5. **Edge Impulse is server-side**: No TinyML on ESP32-CAM. Cloud API keeps firmware simple.
6. **Two connections to ESP32**: Backend pulls video frames; backend pushes commands (buzz/slap).
7. **Required env vars**: `GEMINI_API_KEY` (for backend Gemini coaching), `ELEVENLABS_API_KEY` (for Scribe tokens + TTS).
