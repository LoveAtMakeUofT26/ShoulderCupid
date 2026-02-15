# Epic 6: Live Session UI

**Status**: In Progress (7/8 tasks)
**Goal**: Real-time coaching interface during active sessions

**Labels**: `phase-3`, `frontend`, `real-time`

---

## Tasks

### Task 6.1: Session Start Flow ✅
- [x] Create `PreflightPage` component (replaced `StartSessionModal`)
- [x] Real device validation (camera, mic, speaker via getUserMedia/enumerateDevices)
- [x] Real service validation (backend, STT, AI coach via fetch)
- [x] Camera source selector (webcam vs ESP32-CAM)
- [x] Audio device configuration (mic + speaker dropdowns)
- [x] Live camera preview during preflight
- [x] Mic volume meter (AnalyserNode + requestAnimationFrame)
- [x] Per-check retry on failure
- [x] Call `POST /api/sessions/start`
- [x] Redirect to live session page

**Acceptance Criteria**: Users complete real pre-flight checks + configure I/O before session

---

### Task 6.2: Live Session Page Layout ✅
- [x] Create `LiveSessionPage` component
- [x] Split layout:
  - Left: Video feed (camera view)
  - Right: Coaching panel
  - Bottom: Transcript stream
- [x] Session header:
  - Coach name + avatar
  - Session duration timer
  - Current mode indicator (APPROACH / CONVERSATION)
  - "End Session" button
- [x] Mobile: Stacked layout

**Acceptance Criteria**: Clean, focused UI for active coaching

---

### Task 6.3: WebSocket Connection ✅
- [x] Create `useSessionSocket` hook
- [x] Connect to backend WebSocket
- [x] Subscribe to events:
  - `coaching-update` (new coaching message)
  - `transcript-update` (new transcript entry)
  - `mode-change` (APPROACH ↔ CONVERSATION)
  - `emotion-update` (target emotion changed)
  - `warning-triggered` (comfort escalation)
- [x] Handle reconnection on disconnect
- [x] Show connection status indicator

**Acceptance Criteria**: Real-time updates flow to frontend

---

### Task 6.4: Video Feed Component ⏳
- [ ] Create `VideoFeed` component
- [ ] Receive video frames via WebSocket
- [ ] Render frames in `<canvas>` or `<img>`
- [ ] Overlay indicators:
  - Person detection box (when detected)
  - Emotion label on target face
  - Distance indicator
- [ ] FPS counter (debug mode)
- [x] "No signal" state when disconnected (placeholder)

**Blocked**: Needs ESP32-CAM integration (Epic 2)

---

### Task 6.5: Coaching Panel ✅
- [x] Create `CoachingPanel` component
- [x] Display current coaching message (large text)
- [x] Show coach avatar with pulse animation
- [x] Context indicators:
  - Target emotion (emoji + label)
  - Distance (near/medium/far)
  - Heart rate (calm/elevated/high)
- [x] Coaching mode badge (APPROACH / CONVERSATION)
- [x] Warning indicators (handled by WarningAlert)

**Acceptance Criteria**: Users see coaching advice and context at a glance

---

### Task 6.6: Live Transcript Stream ✅
- [x] Create `TranscriptStream` component
- [x] Real-time transcript entries:
  - User speech (right, gray)
  - Target speech (left, different shade)
  - Coach tips (right, accent color)
- [x] Timestamps on each entry
- [x] Auto-scroll to bottom
- [x] Emotion indicators inline
- [ ] Highlight escalation moments (red border) - future enhancement

**Acceptance Criteria**: Conversation appears in real-time

---

### Task 6.7: Session End Flow ✅
- [x] Create `EndSessionModal` component
- [x] Confirm end session
- [x] Show "Generating report..." loading state
- [ ] Call `POST /api/sessions/:id/end` (needs API)
- [ ] Wait for report generation (needs API)
- [x] Redirect to session report page
- [ ] Option to start new session

**Acceptance Criteria**: Sessions end cleanly with report generated

---

### Task 6.8: Alert & Warning UI ✅
- [x] Create `WarningAlert` component
- [x] Display when comfort warnings trigger:
  - Level 1: Yellow alert (buzz sent)
  - Level 2: Orange alert (slap sent)
  - Level 3: Red alert (abort mode)
- [x] Show suggested de-escalation action
- [x] Auto-dismiss after 5 seconds
- [ ] Sound effect (optional) - future enhancement

**Acceptance Criteria**: Users are aware when comfort system activates

---

## Components Created

| Component | File | Description |
|-----------|------|-------------|
| `useSessionSocket` | `hooks/useSessionSocket.ts` | WebSocket hook for real-time session events |
| `usePreflightChecks` | `hooks/usePreflightChecks.ts` | Real device/service validation hook (6 checks) |
| `PreflightPage` | `components/session/PreflightPage.tsx` | Full-page preflight setup with I/O config |
| `CoachingPanel` | `components/session/CoachingPanel.tsx` | Shows coach, message, and context stats |
| `TranscriptStream` | `components/session/TranscriptStream.tsx` | Real-time conversation display |
| `StatsBar` | `components/session/StatsBar.tsx` | Connection, timer, mode status |
| `WarningAlert` | `components/session/WarningAlert.tsx` | Comfort warning overlays |
| `EndSessionModal` | `components/session/EndSessionModal.tsx` | End session confirmation |
| `CameraSourceSelector` | `components/session/CameraSourceSelector.tsx` | Webcam vs ESP32-CAM toggle + feed |
| `AudioSettings` | `components/session/AudioSettings.tsx` | Mic/speaker device picker |
| `TargetVitalsPanel` | `components/session/TargetVitalsPanel.tsx` | Real-time HR, breathing, HRV display |
| `LiveSessionPage` | `pages/LiveSessionPage.tsx` | Main live session view |

---

## Dependencies

- **Epic 2**: Hardware API for video frames (Task 6.4)
- **Epic 3**: AI Pipeline for coaching responses
- **Epic 4**: Sessions API for start/end endpoints
