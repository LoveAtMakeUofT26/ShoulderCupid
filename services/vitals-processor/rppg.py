"""Heart rate estimation via CHROM (Chrominance-based) rPPG algorithm.

Reference: De Haan & Jeanne (2013) - "Robust Pulse Rate From
Chrominance-Based rPPG"
"""

from collections import deque

import numpy as np
from scipy import signal as scipy_signal

from config import (
    HR_HIGH_HZ,
    HR_LOW_HZ,
    MIN_FPS_FOR_HR,
    RPPG_BUFFER_SECONDS,
    RPPG_MIN_FRAMES,
)


class RPPGEstimator:
    def __init__(self, buffer_seconds: int = RPPG_BUFFER_SECONDS):
        self._samples: deque[tuple[int, np.ndarray]] = deque()  # (ts_ms, [R,G,B])
        self._buffer_seconds = buffer_seconds
        self._last_hr = 0.0
        self._last_hrv = 0.0
        self._last_confidence = 0.0

    def add_sample(self, timestamp_ms: int, roi_rgb: np.ndarray):
        self._samples.append((timestamp_ms, roi_rgb.copy()))

        # Evict old samples
        cutoff = timestamp_ms - self._buffer_seconds * 1000
        while self._samples and self._samples[0][0] < cutoff:
            self._samples.popleft()

    def estimate(self) -> tuple[float, float, float]:
        """Return (heart_rate_bpm, confidence, hrv_ms)."""
        if len(self._samples) < RPPG_MIN_FRAMES:
            return (self._last_hr, 0.0, self._last_hrv)

        timestamps = np.array([s[0] for s in self._samples], dtype=np.float64)
        rgb = np.array([s[1] for s in self._samples], dtype=np.float64)

        # Compute effective FPS
        duration_s = (timestamps[-1] - timestamps[0]) / 1000.0
        if duration_s < 5.0:
            return (0.0, 0.0, 0.0)

        fps = len(timestamps) / duration_s

        if fps < MIN_FPS_FOR_HR:
            return (0.0, 0.0, 0.0)

        # Normalize each channel by its mean
        means = rgb.mean(axis=0)
        means[means < 1e-6] = 1.0  # Avoid division by zero
        rgb_norm = rgb / means

        # CHROM algorithm
        pulse = self._chrom(rgb_norm)

        # Bandpass filter
        try:
            filtered = self._bandpass(pulse, fps, HR_LOW_HZ, HR_HIGH_HZ)
        except ValueError:
            return (self._last_hr, 0.0, self._last_hrv)

        if len(filtered) < 2:
            return (self._last_hr, 0.0, self._last_hrv)

        # FFT to find dominant frequency
        n = len(filtered)
        freqs = np.fft.rfftfreq(n, d=1.0 / fps)
        fft_mag = np.abs(np.fft.rfft(filtered * np.hanning(n)))

        # Only look in HR range
        valid = (freqs >= HR_LOW_HZ) & (freqs <= HR_HIGH_HZ)
        if not valid.any():
            return (self._last_hr, 0.0, self._last_hrv)

        valid_freqs = freqs[valid]
        valid_mag = fft_mag[valid]

        peak_idx = np.argmax(valid_mag)
        peak_freq = valid_freqs[peak_idx]
        peak_power = valid_mag[peak_idx]

        hr_bpm = peak_freq * 60.0

        # Confidence: ratio of peak power to total power in HR band
        total_power = valid_mag.sum()
        confidence = float(peak_power / total_power) if total_power > 0 else 0.0

        # Sanity check: HR should be 40-200 BPM
        if hr_bpm < 40 or hr_bpm > 200:
            return (self._last_hr, 0.0, self._last_hrv)

        # Compute HRV (RMSSD) from inter-beat intervals via pulse peak detection
        hrv_ms = self._compute_hrv(filtered, fps)

        self._last_hr = hr_bpm
        self._last_hrv = hrv_ms
        self._last_confidence = confidence
        return (hr_bpm, confidence, hrv_ms)

    def get_pulse_signal(self) -> tuple[np.ndarray, float] | None:
        """Return the current filtered pulse signal and FPS for breathing estimation."""
        if len(self._samples) < RPPG_MIN_FRAMES:
            return None

        timestamps = np.array([s[0] for s in self._samples], dtype=np.float64)
        rgb = np.array([s[1] for s in self._samples], dtype=np.float64)

        duration_s = (timestamps[-1] - timestamps[0]) / 1000.0
        if duration_s < 5.0:
            return None

        fps = len(timestamps) / duration_s
        if fps < MIN_FPS_FOR_HR:
            return None

        means = rgb.mean(axis=0)
        means[means < 1e-6] = 1.0
        rgb_norm = rgb / means

        pulse = self._chrom(rgb_norm)
        return (pulse, fps)

    @staticmethod
    def _compute_hrv(filtered_pulse: np.ndarray, fps: float) -> float:
        """Compute HRV as RMSSD (ms) from inter-beat intervals in the pulse signal."""
        if len(filtered_pulse) < 10:
            return 0.0

        # Find peaks (heartbeats) in the filtered pulse signal
        # Minimum distance between peaks: at 200 BPM → 0.3s → 0.3*fps samples
        min_distance = max(2, int(0.3 * fps))
        peaks = []
        for i in range(1, len(filtered_pulse) - 1):
            if (
                filtered_pulse[i] > filtered_pulse[i - 1]
                and filtered_pulse[i] > filtered_pulse[i + 1]
            ):
                if not peaks or (i - peaks[-1]) >= min_distance:
                    peaks.append(i)

        if len(peaks) < 3:
            return 0.0

        # Compute RR intervals in milliseconds
        rr_intervals = []
        for i in range(1, len(peaks)):
            rr_ms = (peaks[i] - peaks[i - 1]) / fps * 1000.0
            # Sanity: RR interval should be 300-2000ms (30-200 BPM)
            if 300 < rr_ms < 2000:
                rr_intervals.append(rr_ms)

        if len(rr_intervals) < 2:
            return 0.0

        # RMSSD: root mean square of successive differences
        diffs = np.diff(rr_intervals)
        rmssd = float(np.sqrt(np.mean(diffs ** 2)))

        # Sanity: typical HRV RMSSD is 10-200ms
        if rmssd < 1 or rmssd > 300:
            return 0.0

        return rmssd

    @staticmethod
    def _chrom(rgb_norm: np.ndarray) -> np.ndarray:
        """CHROM algorithm: project normalized RGB into chrominance space."""
        r, g, b = rgb_norm[:, 0], rgb_norm[:, 1], rgb_norm[:, 2]
        xs = 3.0 * r - 2.0 * g
        ys = 1.5 * r + g - 1.5 * b
        std_ys = np.std(ys)
        alpha = np.std(xs) / (std_ys + 1e-8)
        return xs - alpha * ys

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
