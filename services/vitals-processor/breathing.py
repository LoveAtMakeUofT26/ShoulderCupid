"""Breathing rate estimation from rPPG signal or chin landmark tracking."""

from collections import deque

import numpy as np
from scipy import signal as scipy_signal

from config import (
    BR_HIGH_HZ,
    BR_LOW_HZ,
    MIN_FPS_FOR_BR_RPPG,
    RPPG_BUFFER_SECONDS,
)

# Minimum samples for landmark-based BR estimation
MIN_LANDMARK_SAMPLES = 30


class BreathingEstimator:
    def __init__(self, buffer_seconds: int = RPPG_BUFFER_SECONDS):
        self._landmark_buffer: deque[tuple[int, float]] = deque()  # (ts_ms, chin_y)
        self._buffer_seconds = buffer_seconds
        self._last_br = 0.0
        self._last_confidence = 0.0

    def add_landmark_sample(self, timestamp_ms: int, chin_y: float):
        self._landmark_buffer.append((timestamp_ms, chin_y))

        cutoff = timestamp_ms - self._buffer_seconds * 1000
        while self._landmark_buffer and self._landmark_buffer[0][0] < cutoff:
            self._landmark_buffer.popleft()

    def estimate(
        self, rppg_pulse: np.ndarray | None = None, rppg_fps: float = 0.0
    ) -> tuple[float, float]:
        """Estimate breathing rate.

        Tries rPPG-based first (if pulse signal provided with sufficient FPS),
        falls back to landmark-based chin tracking.
        """
        # Try rPPG-based breathing estimation
        if rppg_pulse is not None and rppg_fps >= MIN_FPS_FOR_BR_RPPG:
            br, conf = self._estimate_from_rppg(rppg_pulse, rppg_fps)
            if conf > 0.3:
                self._last_br = br
                self._last_confidence = conf
                return (br, conf)

        # Fall back to landmark-based
        br, conf = self._estimate_from_landmarks()
        if conf > 0:
            self._last_br = br
            self._last_confidence = conf
        return (br, conf)

    def _estimate_from_rppg(
        self, pulse: np.ndarray, fps: float
    ) -> tuple[float, float]:
        if len(pulse) < 64:
            return (0.0, 0.0)

        try:
            filtered = self._bandpass(pulse, fps, BR_LOW_HZ, BR_HIGH_HZ)
        except ValueError:
            return (0.0, 0.0)

        n = len(filtered)
        freqs = np.fft.rfftfreq(n, d=1.0 / fps)
        fft_mag = np.abs(np.fft.rfft(filtered * np.hanning(n)))

        valid = (freqs >= BR_LOW_HZ) & (freqs <= BR_HIGH_HZ)
        if not valid.any():
            return (0.0, 0.0)

        valid_freqs = freqs[valid]
        valid_mag = fft_mag[valid]

        peak_idx = np.argmax(valid_mag)
        peak_freq = valid_freqs[peak_idx]
        peak_power = valid_mag[peak_idx]

        br_per_min = peak_freq * 60.0

        total_power = valid_mag.sum()
        confidence = float(peak_power / total_power) if total_power > 0 else 0.0

        # Sanity: 6-30 breaths per minute
        if br_per_min < 6 or br_per_min > 30:
            return (0.0, 0.0)

        return (br_per_min, confidence)

    def _estimate_from_landmarks(self) -> tuple[float, float]:
        if len(self._landmark_buffer) < MIN_LANDMARK_SAMPLES:
            return (self._last_br, 0.0)

        timestamps = np.array([s[0] for s in self._landmark_buffer], dtype=np.float64)
        chin_y = np.array([s[1] for s in self._landmark_buffer], dtype=np.float64)

        duration_s = (timestamps[-1] - timestamps[0]) / 1000.0
        if duration_s < 10.0:
            return (0.0, 0.0)

        fps = len(timestamps) / duration_s

        # Need at least 2x the highest breathing frequency (Nyquist)
        if fps < BR_HIGH_HZ * 2:
            return (self._last_br, 0.0)

        # Detrend the signal (remove slow drift from head movement)
        chin_detrended = chin_y - np.mean(chin_y)

        try:
            filtered = self._bandpass(chin_detrended, fps, BR_LOW_HZ, BR_HIGH_HZ)
        except ValueError:
            return (self._last_br, 0.0)

        n = len(filtered)
        freqs = np.fft.rfftfreq(n, d=1.0 / fps)
        fft_mag = np.abs(np.fft.rfft(filtered * np.hanning(n)))

        valid = (freqs >= BR_LOW_HZ) & (freqs <= BR_HIGH_HZ)
        if not valid.any():
            return (self._last_br, 0.0)

        valid_freqs = freqs[valid]
        valid_mag = fft_mag[valid]

        peak_idx = np.argmax(valid_mag)
        peak_freq = valid_freqs[peak_idx]
        peak_power = valid_mag[peak_idx]

        br_per_min = peak_freq * 60.0

        total_power = valid_mag.sum()
        confidence = float(peak_power / total_power) if total_power > 0 else 0.0

        # Lower confidence for landmark-based (less reliable than rPPG)
        confidence *= 0.7

        if br_per_min < 6 or br_per_min > 30:
            return (self._last_br, 0.0)

        return (br_per_min, confidence)

    @staticmethod
    def _bandpass(
        sig: np.ndarray, fps: float, low_hz: float, high_hz: float
    ) -> np.ndarray:
        nyquist = fps / 2.0
        low = low_hz / nyquist
        high = min(high_hz / nyquist, 0.99)
        if low >= high or low <= 0:
            raise ValueError("Invalid filter parameters")
        b, a = scipy_signal.butter(4, [low, high], btype="band")
        return scipy_signal.filtfilt(b, a, sig)
