"""Face detection, blink/talk detection, and ROI extraction using MediaPipe Face Mesh."""

from collections import deque
from dataclasses import dataclass

import cv2
import mediapipe as mp
import numpy as np

from config import (
    EAR_CONSEC_FRAMES,
    EAR_THRESHOLD,
    EYEBROW_LEFT,
    EYEBROW_RIGHT,
    FOREHEAD_TOP,
    LEFT_CHEEK_CENTER,
    LEFT_EYE,
    LOWER_LIP,
    MAR_MIN_OPEN_RATIO,
    MAR_THRESHOLD,
    MAR_WINDOW_SIZE,
    MOUTH_LEFT,
    MOUTH_RIGHT,
    RIGHT_CHEEK_CENTER,
    RIGHT_EYE,
    CHIN,
    UPPER_LIP,
    CHEEK_ROI_RADIUS,
)


@dataclass
class FaceResult:
    blinking: bool
    talking: bool
    forehead_roi_mean: np.ndarray | None  # [R, G, B] mean
    cheek_roi_mean: np.ndarray | None     # [R, G, B] mean
    chin_y: float | None                  # Normalized chin y-coordinate


class FaceDetector:
    def __init__(self):
        self._face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self._ear_below_count = 0
        self._blink_detected = False
        self._mar_history: deque[bool] = deque(maxlen=MAR_WINDOW_SIZE)

    def process_frame(self, rgb_frame: np.ndarray) -> FaceResult | None:
        results = self._face_mesh.process(rgb_frame)

        if not results.multi_face_landmarks:
            return None

        landmarks = results.multi_face_landmarks[0]
        h, w = rgb_frame.shape[:2]

        # Convert normalized landmarks to pixel coordinates
        pts = np.array(
            [(lm.x * w, lm.y * h) for lm in landmarks.landmark], dtype=np.float32
        )

        blinking = self._detect_blink(pts)
        talking = self._detect_talking(pts)
        forehead_roi = self._extract_forehead_roi(rgb_frame, pts)
        cheek_roi = self._extract_cheek_roi(rgb_frame, pts)
        chin_y = landmarks.landmark[CHIN].y  # Normalized [0, 1]

        return FaceResult(
            blinking=blinking,
            talking=talking,
            forehead_roi_mean=forehead_roi,
            cheek_roi_mean=cheek_roi,
            chin_y=chin_y,
        )

    def _detect_blink(self, pts: np.ndarray) -> bool:
        left_ear = self._compute_ear(pts, LEFT_EYE)
        right_ear = self._compute_ear(pts, RIGHT_EYE)
        avg_ear = (left_ear + right_ear) / 2.0

        if avg_ear < EAR_THRESHOLD:
            self._ear_below_count += 1
        else:
            if self._ear_below_count >= EAR_CONSEC_FRAMES:
                self._blink_detected = True
            self._ear_below_count = 0

        # Return blink state and reset
        if self._blink_detected:
            self._blink_detected = False
            return True
        return False

    def _detect_talking(self, pts: np.ndarray) -> bool:
        mar = self._compute_mar(pts)
        self._mar_history.append(mar > MAR_THRESHOLD)

        if len(self._mar_history) < 3:
            return False

        open_ratio = sum(self._mar_history) / len(self._mar_history)
        return open_ratio >= MAR_MIN_OPEN_RATIO

    @staticmethod
    def _compute_ear(pts: np.ndarray, eye_indices: list[int]) -> float:
        p1, p2, p3, p4, p5, p6 = [pts[i] for i in eye_indices]
        vertical_1 = np.linalg.norm(p2 - p6)
        vertical_2 = np.linalg.norm(p3 - p5)
        horizontal = np.linalg.norm(p1 - p4)
        if horizontal < 1e-6:
            return 0.3  # Default open
        return (vertical_1 + vertical_2) / (2.0 * horizontal)

    @staticmethod
    def _compute_mar(pts: np.ndarray) -> float:
        top = pts[UPPER_LIP]
        bottom = pts[LOWER_LIP]
        left = pts[MOUTH_LEFT]
        right = pts[MOUTH_RIGHT]
        vertical = np.linalg.norm(top - bottom)
        horizontal = np.linalg.norm(left - right)
        if horizontal < 1e-6:
            return 0.0
        return vertical / horizontal

    @staticmethod
    def _extract_forehead_roi(
        frame: np.ndarray, pts: np.ndarray
    ) -> np.ndarray | None:
        h, w = frame.shape[:2]

        # Define forehead region between eyebrows and top of head
        top = pts[FOREHEAD_TOP]
        left_brow = pts[EYEBROW_LEFT]
        right_brow = pts[EYEBROW_RIGHT]

        # Bounding box: above eyebrows, below forehead top
        x_min = int(max(0, left_brow[0]))
        x_max = int(min(w, right_brow[0]))
        y_min = int(max(0, top[1]))
        y_max = int(min(h, (left_brow[1] + right_brow[1]) / 2))

        if x_max <= x_min or y_max <= y_min:
            return None

        roi = frame[y_min:y_max, x_min:x_max]
        if roi.size == 0:
            return None

        return roi.mean(axis=(0, 1)).astype(np.float64)

    @staticmethod
    def _extract_cheek_roi(
        frame: np.ndarray, pts: np.ndarray
    ) -> np.ndarray | None:
        h, w = frame.shape[:2]
        r = CHEEK_ROI_RADIUS

        rois = []
        for center_idx in [LEFT_CHEEK_CENTER, RIGHT_CHEEK_CENTER]:
            cx, cy = int(pts[center_idx][0]), int(pts[center_idx][1])
            y_min = max(0, cy - r)
            y_max = min(h, cy + r)
            x_min = max(0, cx - r)
            x_max = min(w, cx + r)

            if y_max <= y_min or x_max <= x_min:
                continue

            roi = frame[y_min:y_max, x_min:x_max]
            if roi.size > 0:
                rois.append(roi.mean(axis=(0, 1)))

        if not rois:
            return None

        return np.mean(rois, axis=0).astype(np.float64)

    def close(self):
        self._face_mesh.close()
