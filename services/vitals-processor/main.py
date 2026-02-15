#!/usr/bin/env python3
"""
Vitals Processor (Python) - Drop-in replacement for C++ presage-processor.

Reads JPEG frames from stdin as line-delimited JSON,
processes them with MediaPipe + rPPG algorithms,
outputs JSON metrics to stdout.

Usage:
  python3 main.py <session_id>

Stdin protocol: one JSON object per line
  {"type":"frame","jpeg":"<base64>","ts":<microseconds>}

On stdin EOF: graceful shutdown.
"""

import base64
import json
import signal
import sys
import time

import cv2
import numpy as np

from breathing import BreathingEstimator
from config import EDGE_OUTPUT_INTERVAL_MS, STATUS_INTERVAL_FRAMES
from face_detector import FaceDetector
from rppg import RPPGEstimator

running = True


def handle_signal(_sig, _frame):
    global running
    running = False


def output_json(obj: dict):
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()


def output_metrics(
    session_id: str,
    metric_type: str,
    hr: float,
    br: float,
    hrv: float,
    blinking: bool,
    talking: bool,
    hr_conf: float,
    br_conf: float,
):
    output_json(
        {
            "session_id": session_id,
            "type": metric_type,
            "hr": float(round(hr, 1)),
            "br": float(round(br, 1)),
            "hrv": float(round(hrv, 1)),
            "blinking": bool(blinking),
            "talking": bool(talking),
            "hr_confidence": float(round(hr_conf, 2)),
            "br_confidence": float(round(br_conf, 2)),
            "timestamp": int(time.time() * 1000),
        }
    )


def output_status(session_id: str, status: str, frames_processed: int):
    output_json(
        {
            "session_id": session_id,
            "type": "status",
            "status": status,
            "frames_processed": frames_processed,
        }
    )


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 main.py <session_id>", file=sys.stderr)
        sys.exit(1)

    session_id = sys.argv[1]

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    print(f"[vitals] Session: {session_id}", file=sys.stderr)
    print("[vitals] Mode: stdin (pipe)", file=sys.stderr)

    face_detector = FaceDetector()
    rppg_estimator = RPPGEstimator()
    breathing_estimator = BreathingEstimator()

    output_status(session_id, "ready", 0)
    print("[vitals] Ready, reading frames from stdin", file=sys.stderr)

    frames_fed = 0
    faces_detected = 0
    last_edge_output_time = 0
    fps_window_start = time.time()
    fps_frame_count = 0
    last_fps_log_time = 0

    try:
        for line in sys.stdin:
            if not running:
                break

            line = line.strip()
            if not line:
                continue

            try:
                msg = json.loads(line)
            except json.JSONDecodeError as e:
                print(f"[vitals] JSON parse error: {e}", file=sys.stderr)
                continue

            if msg.get("type") != "frame":
                continue

            jpeg_b64 = msg.get("jpeg", "")
            ts_us = msg.get("ts", 0)

            if not jpeg_b64 or ts_us <= 0:
                print("[vitals] Invalid frame: missing jpeg or ts", file=sys.stderr)
                continue

            # Decode base64 -> JPEG -> numpy array (RGB)
            try:
                jpeg_bytes = base64.b64decode(jpeg_b64)
                np_arr = np.frombuffer(jpeg_bytes, dtype=np.uint8)
                frame_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                if frame_bgr is None:
                    print("[vitals] JPEG decode failed", file=sys.stderr)
                    continue
                frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            except Exception as e:
                print(f"[vitals] Frame decode error: {e}", file=sys.stderr)
                continue

            ts_ms = ts_us // 1000
            frames_fed += 1
            fps_frame_count += 1

            # Log effective FPS every 10 seconds
            now = time.time()
            if now - last_fps_log_time >= 10:
                elapsed = now - fps_window_start
                effective_fps = fps_frame_count / elapsed if elapsed > 0 else 0
                rppg_samples = len(rppg_estimator._samples)
                print(
                    f"[vitals] Stats: effective_fps={effective_fps:.1f}, "
                    f"frames={frames_fed}, faces={faces_detected} "
                    f"({100*faces_detected/max(1,frames_fed):.0f}%), "
                    f"rppg_buffer={rppg_samples}",
                    file=sys.stderr,
                )
                last_fps_log_time = now
                fps_window_start = now
                fps_frame_count = 0

            # Process face
            face_result = face_detector.process_frame(frame_rgb)

            if face_result is None:
                if frames_fed % STATUS_INTERVAL_FRAMES == 0:
                    output_status(session_id, "processing", frames_fed)
                continue

            faces_detected += 1

            # Feed ROI data to estimators
            if face_result.forehead_roi_mean is not None and face_result.cheek_roi_mean is not None:
                roi_rgb = (face_result.forehead_roi_mean + face_result.cheek_roi_mean) / 2.0
                rppg_estimator.add_sample(ts_ms, roi_rgb)

            if face_result.chin_y is not None:
                breathing_estimator.add_landmark_sample(ts_ms, face_result.chin_y)

            # Throttle metric output
            now_ms = int(time.time() * 1000)
            if now_ms - last_edge_output_time >= EDGE_OUTPUT_INTERVAL_MS:
                last_edge_output_time = now_ms

                # Heart rate + HRV
                hr, hr_conf, hrv = rppg_estimator.estimate()

                # Breathing rate (try rPPG-based first, fall back to landmarks)
                pulse_data = rppg_estimator.get_pulse_signal()
                if pulse_data is not None:
                    pulse_signal, pulse_fps = pulse_data
                    br, br_conf = breathing_estimator.estimate(pulse_signal, pulse_fps)
                else:
                    br, br_conf = breathing_estimator.estimate()

                output_metrics(
                    session_id,
                    "core" if hr > 0 else "edge",
                    hr,
                    br,
                    hrv,
                    face_result.blinking,
                    face_result.talking,
                    hr_conf,
                    br_conf,
                )

            if frames_fed % STATUS_INTERVAL_FRAMES == 0:
                output_status(session_id, "processing", frames_fed)

    except KeyboardInterrupt:
        pass
    finally:
        face_detector.close()

    print(
        f"[vitals] EOF/signal, shutting down after {frames_fed} frames",
        file=sys.stderr,
    )
    output_status(session_id, "stopped", frames_fed)


if __name__ == "__main__":
    main()
