"""Constants and thresholds for vitals processing."""

# Frame rate thresholds
# Effective FPS is lower than configured FPS due to HTTP round-trip backpressure.
# At 15 FPS configured, real delivery is ~5-8 FPS through Vercel proxy.
MIN_FPS_FOR_HR = 5        # Below this, skip rPPG heart rate estimation
                          # At 5 FPS Nyquist=2.5 Hz → max detectable HR ~150 BPM
MIN_FPS_FOR_BR_RPPG = 3   # Below this, use landmark-based BR only

# rPPG buffer
RPPG_BUFFER_SECONDS = 30  # Seconds of frames to keep in ring buffer
RPPG_MIN_FRAMES = 45      # Minimum frames before attempting HR estimation (~9s at 5 FPS)

# Heart rate bandpass filter (Hz)
HR_LOW_HZ = 0.7   # ~42 BPM
HR_HIGH_HZ = 4.0  # ~240 BPM

# Breathing rate bandpass filter (Hz)
BR_LOW_HZ = 0.1   # ~6 breaths/min
BR_HIGH_HZ = 0.5  # ~30 breaths/min

# Blink detection (Eye Aspect Ratio)
EAR_THRESHOLD = 0.21
EAR_CONSEC_FRAMES = 2

# Talk detection (Mouth Aspect Ratio)
MAR_THRESHOLD = 0.5
MAR_WINDOW_SIZE = 10  # Rolling window for smoothing
MAR_MIN_OPEN_RATIO = 0.3  # At least 30% of window frames must exceed threshold

# MediaPipe Face Mesh landmark indices
LEFT_EYE = [362, 385, 387, 263, 373, 380]   # p1-p6
RIGHT_EYE = [33, 160, 158, 133, 153, 144]   # p1-p6
UPPER_LIP = 13
LOWER_LIP = 14
MOUTH_LEFT = 61
MOUTH_RIGHT = 291

# Forehead ROI landmarks (polygon vertices)
FOREHEAD_LANDMARKS = [10, 338, 297, 332, 284, 251, 389, 356,
                      454, 323, 361, 288, 397, 365, 379, 378,
                      400, 377, 152, 148, 176, 149, 150, 136,
                      172, 58, 132, 93, 234, 127, 162, 21,
                      54, 103, 67, 109]
# Simplified: use a smaller set for the actual forehead region
FOREHEAD_TOP = 10
FOREHEAD_LEFT = 109
FOREHEAD_RIGHT = 338
EYEBROW_LEFT = 107
EYEBROW_RIGHT = 336

# Cheek ROI landmarks
LEFT_CHEEK_CENTER = 123
RIGHT_CHEEK_CENTER = 352
CHEEK_ROI_RADIUS = 20  # Pixels around center for ROI

# Chin landmark for breathing estimation
CHIN = 152

# Output interval
STATUS_INTERVAL_FRAMES = 50
EDGE_OUTPUT_INTERVAL_MS = 500  # Throttle metric output
