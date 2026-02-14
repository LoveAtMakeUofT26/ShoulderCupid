# ESP32-CAM AI Thinker Integration Guide

## Overview

Single ESP32-CAM handles everything locally, sends processed data to backend.

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
                           │ WiFi (HTTP POST / WebSocket)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend Server                          │
│                                                              │
│  /api/frame    ◄── JPEG + detection data                    │
│  /api/sensors  ◄── distance, heart rate                     │
│  /api/commands ──► servo commands (buzz, slap)              │
│                                                              │
│  Presage SDK ──► Emotion analysis on JPEG                   │
│  Gemini API  ──► Generate coaching response                 │
│  ElevenLabs  ──► TTS for audio coaching                     │
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

## Data Flow

### 1. Frame Capture Loop (runs every 200-500ms)

```cpp
while (session_active) {
    // 1. Capture frame
    camera_fb_t* fb = esp_camera_fb_get();

    // 2. Run Edge Impulse inference
    ei_result = run_classifier(fb->buf, fb->len);

    // 3. If person detected with confidence > 0.7
    if (ei_result.person > 0.7) {
        // Send frame + detection to backend
        POST /api/frame {
            jpeg: base64(fb->buf),
            detection: {
                person: true,
                confidence: 0.85,
                bbox: [x, y, w, h]  // optional
            },
            session_id: "...",
            timestamp: millis()
        }
    }

    esp_camera_fb_return(fb);
    delay(200);
}
```

### 2. Sensor Loop (runs every 100ms)

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
        timestamp: millis()
    }

    delay(100);
}
```

### 3. Command Polling (runs every 500ms)

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

Receives camera frame when person detected.

```typescript
// Request
{
  session_id: string,
  jpeg: string,        // base64 encoded JPEG
  detection: {
    person: boolean,
    confidence: number,
    bbox?: [x, y, w, h]
  },
  timestamp: number
}

// Response
{
  received: true,
  emotion?: string,    // if Presage analyzed
  coaching?: string    // if Gemini responded
}
```

### POST /api/sensors

Receives sensor data.

```typescript
// Request
{
  session_id: string,
  distance: number,      // cm, -1 if no reading
  heart_rate: number,    // BPM, -1 if no reading
  person_detected: boolean,
  timestamp: number
}

// Response
{
  received: true,
  mode: "APPROACH" | "CONVERSATION" | "IDLE"
}
```

### GET /api/commands

ESP32 polls for commands.

```typescript
// Response
{
  commands: ["BUZZ" | "SLAP" | "NONE"][],
  coaching_audio_url?: string  // URL to TTS audio if available
}
```

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
| Frame capture | 50ms | 96x96 grayscale |
| Edge Impulse inference | 100ms | On-device |
| HTTP POST (frame) | 100ms | WiFi + server |
| Presage emotion | 100ms | Backend |
| Gemini coaching | 200ms | Backend |
| Response to ESP32 | 50ms | Included in POST response |
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
- Add capacitor (100µF) across servo power
- Use separate power supply for servo
- Don't share ground with sensitive sensors

---

## Quick Start Checklist

- [ ] Flash ESP32-CAM with Arduino IDE
- [ ] Connect to WiFi (update credentials in code)
- [ ] Train Edge Impulse model with your data
- [ ] Deploy Edge Impulse library to Arduino
- [ ] Wire ultrasonic sensor (GPIO 12, 13)
- [ ] Wire heart rate sensor (I2C GPIO 14, 15)
- [ ] Wire servo (GPIO 2)
- [ ] Start backend server
- [ ] Test `/api/frame` endpoint with Postman
- [ ] Test `/api/sensors` endpoint
- [ ] Full integration test

---

## Next Steps

1. [ ] Create Arduino sketch scaffold
2. [ ] Implement Edge Impulse inference
3. [ ] Add backend endpoints (Epic 2)
4. [ ] Test end-to-end with mock data
5. [ ] Integrate Presage emotion analysis
6. [ ] Connect to Gemini for coaching
