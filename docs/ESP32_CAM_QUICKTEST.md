# ESP32-CAM Quick Test Guide

Minimal setup to test camera streaming to backend. No sensors, no Edge Impulse, just video.

---

## Hardware Needed

- ESP32-CAM AI Thinker
- FTDI programmer (USB to Serial) OR ESP32-CAM-MB (USB programmer board)
- USB cable

---

## Wiring (FTDI Programmer)

```
ESP32-CAM    FTDI
─────────    ────
5V      ──── VCC
GND     ──── GND
U0R     ──── TX
U0T     ──── RX
IO0     ──── GND  (only during upload, remove after)
```

If using ESP32-CAM-MB board, just plug in USB - no wiring needed.

---

## Arduino IDE Setup

### 1. Install ESP32 Board

1. Open Arduino IDE
2. File → Preferences
3. Add to "Additional Board Manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Tools → Board → Boards Manager
5. Search "esp32" → Install "ESP32 by Espressif"

### 2. Select Board

- Tools → Board → ESP32 Arduino → **AI Thinker ESP32-CAM**
- Tools → Port → Select your COM port
- Tools → Partition Scheme → **Huge APP (3MB No OTA)**

---

## Test Sketch

Copy this to Arduino IDE:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include "esp_camera.h"

// ===== EDIT THESE =====
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL = "http://YOUR_COMPUTER_IP:4000/api/frame";
const char* DEVICE_TOKEN = "YOUR_DEVICE_TOKEN";  // must match DEVICE_API_TOKEN in backend .env
const char* SESSION_ID = "test-session-123";
// =======================

// AI Thinker ESP32-CAM pin config
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// Onboard LED
#define LED_PIN 33

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== ESP32-CAM Test ===");

  // LED setup
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH); // LED off (active low)

  // Camera config
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  // Start with low resolution for testing
  config.frame_size = FRAMESIZE_QVGA;  // 320x240
  config.jpeg_quality = 12;             // 0-63 (lower = better quality)
  config.fb_count = 1;

  // Init camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed: 0x%x\n", err);
    blinkError();
    return;
  }
  Serial.println("Camera OK!");

  // Connect WiFi
  Serial.printf("Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nWiFi FAILED!");
    blinkError();
    return;
  }

  Serial.println("\nWiFi OK!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // Success - LED on
  digitalWrite(LED_PIN, LOW);
  Serial.println("\n=== Ready! Sending frames... ===\n");
}

void loop() {
  static unsigned long lastSend = 0;

  // Send frame every 2 seconds (slow for testing)
  if (millis() - lastSend < 2000) return;
  lastSend = millis();

  // Capture frame
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Capture failed");
    return;
  }

  Serial.printf("Frame: %dx%d, %u bytes\n", fb->width, fb->height, fb->len);

  // Send to server
  sendFrame(fb->buf, fb->len);

  // Release frame buffer
  esp_camera_fb_return(fb);
}

void sendFrame(uint8_t* data, size_t len) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected!");
    return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + DEVICE_TOKEN);
  http.setTimeout(5000);

  // Convert to base64
  String base64 = base64Encode(data, len);

  // Build JSON
  String json = "{";
  json += "\"session_id\":\"" + String(SESSION_ID) + "\",";
  json += "\"jpeg\":\"" + base64 + "\",";
  json += "\"detection\":{\"person\":true,\"confidence\":0.95},";
  json += "\"timestamp\":" + String(millis());
  json += "}";

  Serial.printf("Sending %d bytes... ", json.length());

  int code = http.POST(json);

  if (code > 0) {
    Serial.printf("OK (%d)\n", code);
    String response = http.getString();
    Serial.println("Response: " + response);
  } else {
    Serial.printf("FAILED: %s\n", http.errorToString(code).c_str());
  }

  http.end();
}

// Simple base64 encoder
String base64Encode(uint8_t* data, size_t len) {
  const char* table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  String out = "";
  out.reserve((len + 2) / 3 * 4);

  for (size_t i = 0; i < len; i += 3) {
    uint32_t n = data[i] << 16;
    if (i + 1 < len) n |= data[i + 1] << 8;
    if (i + 2 < len) n |= data[i + 2];

    out += table[(n >> 18) & 0x3F];
    out += table[(n >> 12) & 0x3F];
    out += (i + 1 < len) ? table[(n >> 6) & 0x3F] : '=';
    out += (i + 2 < len) ? table[n & 0x3F] : '=';
  }
  return out;
}

void blinkError() {
  while (true) {
    digitalWrite(LED_PIN, LOW);
    delay(200);
    digitalWrite(LED_PIN, HIGH);
    delay(200);
  }
}
```

---

## Upload Steps

1. **Connect IO0 to GND** (puts ESP32 in upload mode)
2. Press the RST button on ESP32-CAM
3. Click Upload in Arduino IDE
4. Wait for "Connecting..." then upload completes
5. **Disconnect IO0 from GND**
6. Press RST again to run the sketch
7. Open Serial Monitor (115200 baud)

---

## Find Your Computer's IP

**Mac:**
```bash
ipconfig getifaddr en0
```

**Windows:**
```bash
ipconfig
```

**Linux:**
```bash
hostname -I
```

Use this IP in the sketch's `SERVER_URL`.

---

## Start Backend

```bash
cd ShoulderCupid/apps/backend
npm run dev
```

Should see: `Server running on http://localhost:4000`

---

## Expected Output

**Serial Monitor (ESP32):**
```
=== ESP32-CAM Test ===
Camera OK!
Connecting to MyWiFi....
WiFi OK!
IP: 192.168.1.105

=== Ready! Sending frames... ===

Frame: 320x240, 12847 bytes
Sending 17152 bytes... OK (200)
Response: {"received":true}

Frame: 320x240, 12692 bytes
Sending 16948 bytes... OK (200)
Response: {"received":true}
```

**Backend Console:**
```
🚀 Server running on http://localhost:4005
POST /api/frame - received frame from test-session-123
```

---

## Troubleshooting

### "Camera init failed: 0x105"
- Check wiring
- Try pressing RST button
- Reduce `xclk_freq_hz` to 10000000

### "WiFi FAILED"
- Check SSID/password (case sensitive)
- Move closer to router
- Check 2.4GHz (ESP32 doesn't support 5GHz)

### "Sending... FAILED: connection refused"
- Is backend running?
- Check SERVER_URL IP address
- Check firewall (allow port 4000)
- Make sure ESP32 and computer are on same network

### "401 Unauthorized"
- Check DEVICE_TOKEN matches DEVICE_API_TOKEN in backend `.env`
- Ensure Authorization header is being sent

### "Sending... FAILED: timeout"
- Reduce image quality: `config.jpeg_quality = 20`
- Reduce resolution: `config.frame_size = FRAMESIZE_QQVGA` (160x120)

### LED keeps blinking
- Error during setup - check Serial Monitor

---

## Test Without ESP32

Use curl to test the endpoint:

```bash
curl -X POST http://localhost:4000/api/frame \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_DEVICE_TOKEN" \
  -d '{"session_id":"SESSION_ID","jpeg":"dGVzdA==","detection":{"person":true,"confidence":0.9},"timestamp":1234567890}'
```

Expected: `{"received":true}`

---

## Next Steps

Once this works:
1. Add Edge Impulse for real person detection
2. Add ultrasonic sensor for distance
3. Add heart rate sensor
4. Increase frame rate (reduce delay)
