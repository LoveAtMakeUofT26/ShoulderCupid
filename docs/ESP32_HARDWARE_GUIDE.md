# ESP32-CAM AI Thinker Integration Guide

## Overview

Single ESP32-CAM handles everything locally, sends processed data to backend. The backend also supports a **webcam mode** where a browser webcam replaces the ESP32 camera (no hardware needed for development).

```
┌─────────────────────────────────────────────────────────────┐
│                    ESP32-CAM AI Thinker                      │
│                                                              │
│  Camera (OV2640)                                             │
│      │                                                       │
│      ▼                                                       │
│  Edge Impulse Model (person detection, runs on device)       │
│      │                                                       │
│      ├─► Person detected? ──► Send JPEG frame to backend     │
│      │                                                       │
│  Ultrasonic Sensor ──► Distance to target                    │
│  Heart Rate Sensor ──► Wearer BPM                            │
│  Servo Motor ◄─────── Slap commands from backend             │
│                                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │ WiFi (HTTP POST)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               Browser (Webcam Fallback)                      │
│                                                              │
│  getUserMedia ──► JPEG capture ──► POST /api/frame           │
│  (source: 'webcam', no detection data)                       │
│                                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend Server (:4000)                      │
│                                                              │
│  REST Endpoints (Hardware API):                              │
│    POST /api/frame          ◄── JPEG + detection data        │
│    POST /api/sensors        ◄── distance, heart rate         │
│    GET  /api/commands       ──► servo commands (buzz, slap)  │
│    POST /api/devices/pair   ◄── device pairing               │
│    POST /api/trigger-warning◄── manual comfort warning       │
│    GET  /api/presage/status ──► Presage health check         │
│                                                              │
│  WebSocket Events (Socket.IO):                               │
│    session-state, mode-change, sensors-update,               │
│    emotion-update, target-vitals, person-detected,           │
│    coaching-update, coach-audio, transcript-update,          │
│    warning-triggered, presage-error                          │
│                                                              │
│  Processing Pipeline:                                        │
│    Frames saved to disk ──► Presage C++ processor            │
│    ──► Vitals (HR, BR, HRV, blinking, talking)              │
│    ──► Emotion derived from vitals                           │
│    Gemini API ──► Coaching responses                         │
│    ElevenLabs ──► TTS audio for coaching                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Hardware Setup

### Components

| Component | Model | Purpose | Pins |
|-----------|-------|---------|------|
| ESP32-CAM | AI Thinker | Main board + camera | - |
| Ultrasonic | HC-SR04 | Distance measurement | GPIO 12 (Trig), GPIO 13 (Echo) |
| Heart Rate | MAX30102 | BPM monitoring | I2C (GPIO 14 SDA, GPIO 15 SCL) |
| Servo | SG90 | Slap mechanism | GPIO 2 |

### Pin Mapping (ESP32-CAM AI Thinker)

```
Available GPIOs (camera uses most pins):
- GPIO 2  - Servo (also onboard LED)
- GPIO 12 - Ultrasonic Trigger
- GPIO 13 - Ultrasonic Echo
- GPIO 14 - I2C SDA (heart rate)
- GPIO 15 - I2C SCL (heart rate)
- GPIO 16 - Available (U2RXD)
```

**Note:** ESP32-CAM has limited free GPIOs. The camera uses GPIO 0, 4, 5, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33, 34, 35, 36, 39.

---

## Authentication

All hardware endpoints (except `GET /api/presage/status`) require authentication via the `requireHardwareAuth` middleware. Three methods are supported:

1. **User session** - Authenticated browser session (cookie-based, used by webcam mode)
2. **Bearer token** - `Authorization: Bearer <DEVICE_API_TOKEN>` header
3. **Device token header** - `X-Device-Token: <DEVICE_API_TOKEN>` header
4. **Query/body param** - `device_token` as query parameter or in request body

Set `DEVICE_API_TOKEN` in your `.env` file. The ESP32 should include this token in every request.

---

## Data Flow

### 1. Frame Capture Loop (runs every 200-500ms)

```cpp
while (session_active) {
    // 1. Capture frame
    camera_fb_t* fb = esp_camera_fb_get();

    // 2. Run Edge Impulse inference
    ei_result = run_classifier(fb->buf, fb->len);

    // 3. If person detected with confidence > 0.5
    if (ei_result.person > 0.5) {
        // Send frame + detection to backend
        POST /api/frame {
            session_id: "...",
            jpeg: base64(fb->buf),
            detection: {
                person: true,
                confidence: 0.85,
                bbox: [x, y, w, h]  // optional
            },
            timestamp: millis()
        }
    }

    esp_camera_fb_return(fb);
    delay(200);
}
```

### 2. Webcam Mode (Browser Fallback)

When no ESP32 is connected, the frontend captures webcam frames and sends them directly:

```typescript
// Frontend sends frames at ~2 FPS
POST /api/frame {
    session_id: "...",
    jpeg: "data:image/jpeg;base64,...",  // data URL or raw base64
    detection: null,                      // no on-device detection
    timestamp: Date.now(),
    source: "webcam"                      // skips person detection check
}
```

When `source: "webcam"`, the backend processes every frame regardless of detection data.

### 3. Sensor Loop (runs every 100ms)

```cpp
while (session_active) {
    // Read sensors
    float distance = readUltrasonic();  // cm
    int heartRate = readHeartRate();    // BPM

    // Send to backend
    POST /api/sensors {
        session_id: "...",
        distance: 145.5,
        heart_rate: 85,
        person_detected: true
    }

    delay(100);
}
```

### 4. Command Polling (runs every 500ms)

```cpp
while (session_active) {
    // Poll for commands
    GET /api/commands?session_id=...

    // Response: { commands: ["BUZZ", "SLAP"] }
    for (cmd in commands) {
        if (cmd == "BUZZ") vibrateMotor(200);
        if (cmd == "SLAP") triggerServo();
    }

    delay(500);
}
```

---

## Backend Endpoints

### POST /api/frame

Receives camera frame from ESP32 or browser webcam. Saves the frame to disk for Presage processing, starts per-session C++ processor if needed, and returns derived emotion.

```typescript
// Request
{
  session_id: string,         // MongoDB ObjectId
  jpeg: string,               // base64 JPEG (with or without data URL prefix)
  detection: {                // null when source is 'webcam'
    person: boolean,
    confidence: number,
    bbox?: [x, y, w, h]
  } | null,
  timestamp: number,          // millis() or Date.now()
  source?: "webcam"           // optional - skips person detection check
}

// Response
{
  received: true,
  emotion?: string,           // derived from Presage vitals: "neutral" | "excited" | "nervous" | "calm" | "engaged" | "anxious"
  coaching?: string           // reserved for future Gemini coaching response
}
```

**Side effects via WebSocket:**
- `person-detected` - when ESP32 detects a person (confidence > 0.5)
- `target-vitals` - Presage metrics: `{ heart_rate, breathing_rate, hrv, blinking, talking }`
- `emotion-update` - derived emotion label + confidence
- `presage-error` - if Presage processor encounters errors

### POST /api/sensors

Receives sensor data from ESP32. Updates session state and triggers mode transitions.

```typescript
// Request
{
  session_id: string,           // MongoDB ObjectId
  distance: number,             // cm, -1 if no reading
  heart_rate: number,           // BPM, -1 if no reading
  person_detected: boolean
}

// Response
{
  received: true,
  mode: "IDLE" | "APPROACH" | "CONVERSATION"
}
```

**Mode transition rules:**
- No person detected → `IDLE`
- Person detected, distance > 150cm → `APPROACH`
- Person detected, distance ≤ 150cm → `CONVERSATION`

**Side effects:**
- `BUZZ` command queued when heart rate > 120 BPM
- `sensors-update` WebSocket event broadcast
- `mode-change` WebSocket event when mode transitions

### GET /api/commands

ESP32 polls for pending commands. Commands are consumed (cleared) on read.

```typescript
// Query params
session_id: string              // MongoDB ObjectId

// Response
{
  commands: string[],           // ["BUZZ", "SLAP"] - empty array if none
  coaching_audio_url: null      // reserved for future TTS audio URL
}
```

### POST /api/devices/pair

Pair an ESP32 device with a user account. (Not yet implemented)

```typescript
// Request
{
  device_id: string,
  pairing_code: string
}

// Response
{
  success: true,
  message: "Device pairing not yet implemented"
}
```

### POST /api/trigger-warning

Manually trigger a comfort warning. Useful for testing the escalation system.

```typescript
// Request
{
  session_id: string,           // MongoDB ObjectId
  level: 1 | 2 | 3             // 1=mild, 2=moderate, 3=severe
}

// Response
{
  success: true,
  level: number
}
```

**Escalation behavior:**
- Level 1 → queues `BUZZ` command + broadcasts warning message
- Level 2-3 → queues `SLAP` command + broadcasts warning message
- Generates TTS audio via ElevenLabs using the session coach's voice

**Warning messages:**
- Level 1: "Take a breath. You seem a bit nervous."
- Level 2: "Slow down! Give them some space."
- Level 3: "Abort! Step back now."

**Side effects via WebSocket:**
- `warning-triggered` - `{ level, message }`
- `coach-audio` - `{ audio: base64, format: "mp3", text }` (if coach has voice_id)

### GET /api/presage/status

Health check for the Presage processing system. **No authentication required.**

```typescript
// Response
{
  binaryInstalled: boolean,     // true if C++ processor binary exists
  apiKeyConfigured: boolean,    // true if PRESAGE_API_KEY is set
  framesDir: string,            // path to frame storage directory
  processorPath: string,        // path to C++ processor binary
  activeSessions: string[],     // session IDs with running processors
  errors: Record<string, string> // per-session error messages
}
```

---

## WebSocket Events

The backend uses Socket.IO for real-time communication with the frontend. Clients join a session room via the `join-session` event.

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join-session` | `{ sessionId }` | Join session room, receive initial state |
| `start-coaching` | `{ sessionId }` | Initialize Gemini coaching with selected coach |
| `transcript-input` | `{ sessionId, text, speaker, isFinal }` | Send speech transcript for coaching |
| `end-session` | `{ sessionId }` | Leave session, cleanup state |
| `watch-device` | `deviceId` | Subscribe to device updates |
| `stop-watching` | `deviceId` | Unsubscribe from device updates |

### Server → Client Events

| Event | Payload | Source |
|-------|---------|--------|
| `session-state` | `{ mode, targetEmotion, distance, heartRate }` | On join |
| `mode-change` | `{ mode, prevMode }` | Sensor-driven transitions |
| `sensors-update` | `{ distance, heartRate, personDetected }` | POST /api/sensors |
| `emotion-update` | `{ emotion, confidence }` | Presage analysis |
| `target-vitals` | `{ heart_rate, breathing_rate, hrv, blinking, talking }` | Presage metrics |
| `person-detected` | `{ confidence, bbox, timestamp }` | POST /api/frame (ESP32) |
| `coaching-update` | `{ message }` | Gemini coaching text |
| `coach-audio` | `{ audio, format, text }` | ElevenLabs TTS (base64 mp3) |
| `transcript-update` | `{ id, speaker, text, timestamp, emotion }` | Transcript entries |
| `warning-triggered` | `{ level, message }` | Comfort warnings |
| `presage-error` | `{ error }` | Presage processor errors |
| `coaching-error` | `{ error }` | Coaching pipeline failures |
| `coaching-ready` | `{ sessionId, coachName, voiceId }` | Coach initialized |

---

## Presage Integration

The backend uses the **Presage SmartSpectra SDK** via a C++ processor binary for contactless vital sign monitoring from video frames.

### Architecture

```
Browser/ESP32 ──► POST /api/frame ──► frameBuffer.ts
                                          │
                                    Writes JPEG to disk:
                                    /opt/cupid/data/frames/{sessionId}/
                                    frame{timestamp_us}.jpg
                                          │
                                          ▼
                                    presage-processor (C++)
                                    (one process per session)
                                          │
                                    Reads frames, outputs JSON to stdout:
                                    { hr, br, hrv, blinking, talking, timestamp }
                                          │
                                          ▼
                                    presageMetrics.ts
                                    ──► Stores latest metrics
                                    ──► Derives emotion from vitals
                                    ──► Broadcasts via WebSocket
```

### Metrics

| Metric | Type | Description | Requires API Key |
|--------|------|-------------|------------------|
| `hr` | number | Heart rate (BPM) | Yes |
| `br` | number | Breathing rate (breaths/min) | No |
| `hrv` | number | Heart rate variability (ms) | Yes |
| `blinking` | boolean | Target is blinking | No |
| `talking` | boolean | Target is talking | No |

### Emotion Derivation

Emotions are derived from physiological signals (not facial expression):

| Condition | Emotion |
|-----------|---------|
| HR > 110 | `excited` |
| HR > 100 | `nervous` |
| HR < 75 (and > 0) | `calm` |
| Talking + HR 70-95 | `engaged` |
| BR > 20 | `anxious` |
| Talking + no HR data | `engaged` |
| Default | `neutral` |

### Setup

1. Build the C++ processor on your server:
   ```bash
   cd /opt/cupid/services/presage-processor
   mkdir build && cd build
   cmake .. && make
   ```

2. Configure environment variables:
   ```bash
   PRESAGE_API_KEY=your-presage-api-key        # Enables HR/HRV (cloud processing)
   PRESAGE_PROCESSOR_PATH=/opt/cupid/services/presage-processor/build/presage-processor
   FRAMES_DIR=/opt/cupid/data/frames            # Where frames are written
   ```

3. The processor starts automatically per-session when the first frame arrives.

---

## Edge Impulse Setup

### 1. Create Project

1. Go to [edgeimpulse.com](https://edgeimpulse.com)
2. Create new project: "Cupid Person Detection"
3. Choose "Images" as data type

### 2. Collect Training Data

- Capture ~100+ images WITH person
- Capture ~100+ images WITHOUT person
- Use variety of lighting, angles, distances

### 3. Create Impulse

```
Image data (96x96 grayscale)
    │
    ▼
Image processing block
    │
    ▼
Transfer Learning (MobileNetV2)
    │
    ▼
Output: person (0.0 - 1.0)
```

### 4. Deploy to ESP32

1. Go to Deployment
2. Select "Arduino Library"
3. Download and add to Arduino IDE
4. Include in your sketch:

```cpp
#include <cupid-person-detection_inferencing.h>

// Run inference
ei_impulse_result_t result;
signal_t signal;
signal.total_length = EI_CLASSIFIER_INPUT_WIDTH * EI_CLASSIFIER_INPUT_HEIGHT;
signal.get_data = &get_camera_data;

run_classifier(&signal, &result, false);

float person_confidence = result.classification[0].value;
```

---

## Arduino Sketch Structure

```
firmware/
├── cupid_esp32cam/
│   ├── cupid_esp32cam.ino      # Main sketch
│   ├── camera.h                 # Camera setup
│   ├── wifi_manager.h           # WiFi connection
│   ├── api_client.h             # HTTP client for backend
│   ├── sensors.h                # Ultrasonic, heart rate
│   ├── servo_control.h          # Slap mechanism
│   └── edge_impulse.h           # ML inference wrapper
```

### Main Loop

```cpp
void loop() {
    if (!session_active) {
        // Poll for session start or wait for button
        checkSessionStart();
        return;
    }

    // Run tasks at different intervals
    unsigned long now = millis();

    // Frame capture + inference (every 200ms)
    if (now - lastFrame > 200) {
        captureAndInfer();
        lastFrame = now;
    }

    // Sensor reading (every 100ms)
    if (now - lastSensor > 100) {
        readAndSendSensors();
        lastSensor = now;
    }

    // Command polling (every 500ms)
    if (now - lastCommand > 500) {
        pollCommands();
        lastCommand = now;
    }
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `4000` | Backend server port |
| `DEVICE_API_TOKEN` | Yes (prod) | - | Shared secret for ESP32 auth |
| `PRESAGE_API_KEY` | No | - | Enables HR/HRV via cloud processing |
| `PRESAGE_PROCESSOR_PATH` | No | `/opt/cupid/services/presage-processor/build/presage-processor` | Path to C++ binary |
| `FRAMES_DIR` | No | `/opt/cupid/data/frames` | Frame storage directory |
| `GOOGLE_AI_API_KEY` | Yes | - | Gemini API for coaching |
| `ELEVENLABS_API_KEY` | Yes | - | ElevenLabs TTS for coach audio |

---

## Power Considerations

| Component | Current Draw |
|-----------|-------------|
| ESP32-CAM active | ~180mA |
| Camera streaming | ~80mA |
| Edge Impulse inference | ~50mA spike |
| Servo (moving) | ~200mA |
| Total peak | ~500mA |

**Recommended:** 5V 1A power bank or 2x 18650 batteries with regulator.

---

## WiFi Optimization

```cpp
// Use static IP for faster connection
IPAddress local_IP(192, 168, 1, 100);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
WiFi.config(local_IP, gateway, subnet);

// Reduce WiFi power for battery life
WiFi.setSleep(WIFI_PS_MIN_MODEM);

// Use HTTP/1.1 keep-alive for faster requests
http.setReuse(true);
```

---

## Latency Budget

Target: < 500ms end-to-end coaching response

| Step | Target | Notes |
|------|--------|-------|
| Frame capture | 50ms | 96x96 grayscale (ESP32) or 640x480 (webcam) |
| Edge Impulse inference | 100ms | On-device (ESP32 only) |
| HTTP POST (frame) | 100ms | WiFi + server |
| Presage vitals | 100ms | C++ processor reads from disk |
| Gemini coaching | 200ms | Backend |
| Response to client | 50ms | Included in POST response or WebSocket |
| **Total** | **~500ms** | |

---

## Troubleshooting

### Camera not initializing
```cpp
// Try reducing frame size
config.frame_size = FRAMESIZE_96X96;  // or FRAMESIZE_QVGA
config.fb_count = 1;  // Reduce buffer count
```

### WiFi drops frequently
- Check antenna placement (don't cover with metal)
- Use external antenna if available
- Reduce frame rate if bandwidth limited

### Edge Impulse model too slow
- Use smaller input size (96x96 instead of 240x240)
- Quantize model (int8 instead of float32)
- Reduce inference frequency

### Servo jitters
- Add capacitor (100uF) across servo power
- Use separate power supply for servo
- Don't share ground with sensitive sensors

### Presage processor not starting
- Check binary exists: `ls /opt/cupid/services/presage-processor/build/presage-processor`
- Check `GET /api/presage/status` for diagnostics
- Check frames directory is writable: `ls -la /opt/cupid/data/frames/`

### Presage "UNAUTHENTICATED" error
- Set `PRESAGE_API_KEY` in `.env`
- HR and HRV require a valid API key; BR/blinking/talking work without one

### 401 Unauthorized on hardware endpoints
- Set `DEVICE_API_TOKEN` in `.env`
- ESP32 must send `Authorization: Bearer <token>` or `X-Device-Token: <token>` header
- Or pass `device_token` as query param / body field

---

## Quick Start Checklist

- [ ] Flash ESP32-CAM with Arduino IDE
- [ ] Connect to WiFi (update credentials in code)
- [ ] Set `DEVICE_API_TOKEN` in backend `.env`
- [ ] Train Edge Impulse model with your data
- [ ] Deploy Edge Impulse library to Arduino
- [ ] Wire ultrasonic sensor (GPIO 12, 13)
- [ ] Wire heart rate sensor (I2C GPIO 14, 15)
- [ ] Wire servo (GPIO 2)
- [ ] Start backend server (`npm run dev` on port 4000)
- [ ] Test `GET /api/presage/status` for system health
- [ ] Test `POST /api/frame` endpoint with curl
- [ ] Test `POST /api/sensors` endpoint
- [ ] Test `POST /api/trigger-warning` for comfort escalation
- [ ] Full integration test with WebSocket events

### Quick curl tests

```bash
# Health check (no auth)
curl http://localhost:4000/api/presage/status

# Send test frame (with auth)
curl -X POST http://localhost:4000/api/frame \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_DEVICE_TOKEN" \
  -d '{"session_id":"SESSION_ID","jpeg":"dGVzdA==","detection":{"person":true,"confidence":0.9},"timestamp":1234567890}'

# Send sensor data
curl -X POST http://localhost:4000/api/sensors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_DEVICE_TOKEN" \
  -d '{"session_id":"SESSION_ID","distance":120,"heart_rate":85,"person_detected":true}'

# Poll for commands
curl "http://localhost:4000/api/commands?session_id=SESSION_ID" \
  -H "Authorization: Bearer YOUR_DEVICE_TOKEN"

# Trigger warning (testing)
curl -X POST http://localhost:4000/api/trigger-warning \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_DEVICE_TOKEN" \
  -d '{"session_id":"SESSION_ID","level":1}'
```

---

## Next Steps

1. [ ] Create Arduino sketch scaffold
2. [ ] Implement Edge Impulse inference
3. [ ] Implement device registration (`POST /api/devices/register`)
4. [ ] Implement device status endpoint (`GET /api/devices/status`)
5. [ ] Add command auto-expiry (currently commands persist until polled)
6. [ ] Add coaching audio URL to command response
7. [ ] Test end-to-end with real ESP32 hardware
