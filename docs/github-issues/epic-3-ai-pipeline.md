# Epic 3: AI Pipeline

**Goal**: Full AI coaching loop (detection → emotion → STT → LLM → TTS)

**Labels**: `phase-2`, `backend`, `ai`

---

## Tasks

### Task 3.1: Edge Impulse Integration (Person Detection)
- [ ] ESP32-CAM runs Edge Impulse model on-device
- [ ] Backend receives detection results: `{ person_detected, gender }`
- [ ] Create `services/detection.ts` to process results
- [ ] Trigger coaching mode based on detection:
  - No person → IDLE
  - Person detected → APPROACH mode
- [ ] Log detection events

**Note**: Model runs on ESP32-CAM (TinyML), backend only receives results

**Acceptance Criteria**: Backend reacts to person detection from device

---

### Task 3.2: Presage SDK Integration (Emotion Analysis)
- [ ] Install Presage SDK (C++ with Node bindings or REST wrapper)
- [ ] Create `services/presage.ts`
- [ ] Process camera frames through Presage
- [ ] Extract emotion classification (happy, nervous, disgusted, neutral, etc.)
- [ ] Only activate when in CONVERSATION mode (<150cm)
- [ ] Return emotion + confidence score

**Acceptance Criteria**: Backend analyzes target's facial emotion from frames

---

### Task 3.3: ElevenLabs Speech-to-Text
- [ ] Create ElevenLabs account + API key
- [ ] Install ElevenLabs SDK
- [ ] Create `services/stt.ts`
- [ ] Implement `POST /api/audio` endpoint for audio chunks
- [ ] Stream audio to ElevenLabs STT
- [ ] Return transcript text
- [ ] Handle partial/streaming transcripts

**Acceptance Criteria**: Audio from mic is transcribed to text

---

### Task 3.4: ElevenLabs Text-to-Speech
- [ ] Create `services/tts.ts`
- [ ] Map coach personalities to ElevenLabs voice IDs
- [ ] Convert coaching text to speech (Turbo v2.5 for low latency)
- [ ] Return audio buffer (MP3/WAV)
- [ ] Cache common phrases for faster response

**Acceptance Criteria**: Coaching text is converted to natural speech

---

### Task 3.5: Gemini Coaching LLM
- [ ] Install `@google/generative-ai`
- [ ] Create `services/llm.ts`
- [ ] Build system prompt with coach personality
- [ ] Implement two coaching modes:

**APPROACH MODE** (person detected, distance > 150cm):
```
Context: { target_gender, distance_cm, heart_rate_bpm, mode: "approach" }
Output: Hype, approach tips, opening line suggestions
```

**CONVERSATION MODE** (distance < 150cm):
```
Context: { transcript, target_emotion, distance_cm, heart_rate_bpm, history[] }
Output: Real-time conversation guidance
```

- [ ] Parse response format: `{ "say": "...", "note": "..." }`
- [ ] Keep responses SHORT (1-2 sentences max)

**Acceptance Criteria**: Gemini generates contextual coaching advice

---

### Task 3.6: AI Pipeline Orchestrator
- [ ] Create `services/aiPipeline.ts`
- [ ] Implement state machine: IDLE → APPROACH → CONVERSATION → REPORT
- [ ] Orchestrate flow:
  1. Receive frame → Edge Impulse result (from device)
  2. If CONVERSATION mode → Presage emotion analysis
  3. Receive audio → ElevenLabs STT → transcript
  4. Assemble context → Gemini → coaching response
  5. Coaching text → ElevenLabs TTS → audio
  6. Queue audio command for ESP32
- [ ] Track conversation history per session
- [ ] Log all interactions to session document

**Acceptance Criteria**: Full AI loop works end-to-end

---

### Task 3.7: Coaching Endpoint
- [ ] Implement `POST /api/coach`
- [ ] Accept full context object
- [ ] Return coaching audio stream URL
- [ ] Support WebSocket streaming for real-time coaching

**Request**:
```json
{
  "sessionId": "xxx",
  "transcript": "Hi, nice weather today",
  "target_emotion": "happy",
  "distance_cm": 80,
  "heart_rate_bpm": 92
}
```

**Response**:
```json
{
  "say": "She's smiling, king. Ask about her plans for the weekend.",
  "audio_url": "/api/audio/abc123.mp3"
}
```

**Acceptance Criteria**: Single endpoint for getting coaching response

---
