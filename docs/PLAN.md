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
- Audio flow: Browser mic -> backend (ElevenLabs STT) -> transcript
- TTS flow: Backend (ElevenLabs TTS) -> browser -> Bluetooth earbuds

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
│  ├── ElevenLabs STT (audio from browser -> text)         │
│  ├── ElevenLabs TTS (coaching text -> audio)             │
│  ├── Gemini API (coaching LLM)                           │
│  ├── Command queue (buzz/slap -> ESP32)                  │
│  └── MongoDB (users, sessions, transcripts)              │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│              BROWSER / FRONTEND (Vercel)                   │
│                                                           │
│  React + Vite + TypeScript + Tailwind                    │
│  ├── Requests mic permission (Web Audio API)             │
│  ├── Captures audio from Bluetooth earbuds               │
│  ├── Streams audio to backend for STT                    │
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
   └─► Streams to backend via WebSocket
   └─► ElevenLabs STT -> transcript text

4. Backend assembles context
   {
     person_detected, gender, distance_cm,
     heart_rate_bpm, target_emotion,
     transcript, conversation_history,
     coach_personality
   }

5. Gemini API generates coaching response
   └─► Short 1-2 sentence coaching line

6. ElevenLabs TTS converts coaching text to audio
   └─► Streamed back to browser -> Bluetooth earbuds

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

### ESP32 Hardware
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/frame` | Receive JPEG frame from ESP32-CAM |
| GET | `/api/stream` | Expose MJPEG stream to frontend |
| POST | `/api/sensors` | Receive sensor data (distance, HR) |
| GET | `/api/commands` | Command queue for ESP32 (buzz, slap) |

### AI Pipeline
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/audio` | Receive audio chunk from browser, STT |
| POST | `/api/coach` | Assemble context, get coaching response |
| WS | `/ws/session` | Real-time session data (bidirectional) |

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
| **ElevenLabs STT** | Speech-to-text from earbuds mic | Backend (API call) |
| **ElevenLabs TTS** | Coaching text to speech | Backend (API call) |
| **Gemini API** | Coaching LLM + session reports | Backend (API call) |

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

### Phase 2: Hardware + Audio Integration (CURRENT)
- [ ] ESP32-CAM streaming MJPEG to backend
- [ ] Backend exposes video stream endpoint
- [ ] Frontend displays live video feed
- [ ] Browser audio capture (mic permissions + Web Audio API)
- [ ] Audio streaming to backend via WebSocket
- [ ] ElevenLabs STT integration
- [ ] ElevenLabs TTS integration + playback to earbuds
- [ ] Edge Impulse person detection on backend
- [ ] Presage C++ SDK on Vultr Ubuntu

### Phase 3: AI Coaching Loop
- [ ] Gemini coaching LLM with full context
- [ ] Approach mode (person detected, far away)
- [ ] Conversation mode (close, STT active)
- [ ] Coach personality system (prompt variations)
- [ ] Comfort check + slap escalation logic
- [ ] Command queue (buzz/slap -> ESP32)

### Phase 4: Sessions + Reports
- [ ] Session lifecycle (start/end)
- [ ] Transcript storage in MongoDB
- [ ] Emotion timeline tracking
- [ ] Post-session Gemini report generation
- [ ] Session history on frontend
- [ ] Session detail view with report

### Phase 5: Polish + Deploy
- [ ] Onboarding wizard (profile, quiz, hardware setup)
- [ ] Landing page
- [ ] Payment flow (Solana or Stripe)
- [ ] Deploy backend to Vultr
- [ ] Deploy frontend to Vercel
- [ ] Edge case handling (disconnects, timeouts)
- [ ] Demo video

---

## Key Technical Notes

1. **ESP32-CAM is dumb**: It only streams video. All intelligence is on the backend.
2. **Browser is the audio device**: No ESP32 audio. User's phone/laptop with Bluetooth earbuds handles mic input and coaching audio output.
3. **Presage needs Ubuntu**: C++ SDK won't run on macOS easily. Vultr Ubuntu VPS is the target.
4. **Edge Impulse is server-side**: No TinyML on ESP32-CAM. Cloud API keeps firmware simple.
5. **Two connections to ESP32**: Backend pulls video frames; backend pushes commands (buzz/slap).
