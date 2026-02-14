# Epic 2: Hardware API Layer

**Goal**: Backend endpoints for ESP32 communication

**Labels**: `phase-1`, `phase-2`, `backend`, `hardware-integration`

---

## Tasks

### Task 2.1: Frame Ingestion Endpoint
- [ ] Implement `POST /api/frame` (multipart JPEG upload)
- [ ] Parse incoming frame from ESP32-CAM
- [ ] Store frame temporarily for processing
- [ ] Return detection results to ESP32
- [ ] Add rate limiting (max 5 FPS per device)

**Request**:
```
POST /api/frame
Content-Type: multipart/form-data
Body: { frame: <JPEG binary>, deviceId: string }
```

**Response**:
```json
{ "person_detected": true, "gender": "female", "emotion": "happy" }
```

**Acceptance Criteria**: Backend receives JPEG frames from ESP32-CAM

---

### Task 2.2: Sensor Data Endpoint
- [ ] Implement `POST /api/sensors`
- [ ] Accept distance (cm) and heart_rate (BPM)
- [ ] Store in current session state (Redis or in-memory)
- [ ] Trigger mode transitions (Approach → Conversation at <150cm)

**Request**:
```json
{ "deviceId": "xxx", "distance_cm": 120, "heart_rate_bpm": 85 }
```

**Acceptance Criteria**: Backend tracks real-time sensor data per device

---

### Task 2.3: Command Queue System
- [ ] Create in-memory command queue per device
- [ ] Implement `GET /api/commands` (ESP32 polls for commands)
- [ ] Support command types: `buzz`, `slap`, `slap_loop`, `audio_url`
- [ ] Auto-expire commands after 5 seconds
- [ ] Implement `POST /api/commands` (internal: queue a command)

**Response**:
```json
{ "commands": [{ "type": "buzz", "duration_ms": 500 }] }
```

**Acceptance Criteria**: ESP32 can poll and receive commands

---

### Task 2.4: Device Registration & Pairing
- [ ] Implement `POST /api/devices/register` (ESP32 self-registers)
- [ ] Generate unique device UUID
- [ ] Implement `POST /api/devices/pair` (user claims device)
- [ ] Link device to user account
- [ ] Implement `GET /api/devices/status` (connection status)

**Acceptance Criteria**: Users can pair ESP32 device to their account

---

### Task 2.5: Comfort Check & Escalation Logic
- [ ] Create comfort monitoring service
- [ ] Track consecutive "uncomfortable" emotion readings
- [ ] Implement escalation rules:
  - Warning 1 → queue `buzz` command
  - Warning 2 → queue `slap` command
  - Warning 3+ → queue `slap_loop` + trigger abort audio
- [ ] Reset warnings when emotion improves
- [ ] Log escalation events to session

**Acceptance Criteria**: Backend automatically triggers warnings based on emotion

---
