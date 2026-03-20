"""
YOLOv8 wrapper for person detection and crowd counting.
"""
from ultralytics import YOLO
from config import YOLO_MODEL, YOLO_CONFIDENCE, PERSON_CLASS_ID, DENSITY_THRESHOLDS, WAIT_TIME_PER_PERSON


class CrowdDetector:
    """Detects people in frames using YOLOv8 and computes crowd metrics."""

    def __init__(self):
        self.model = None

    def load_model(self):
        """Load YOLOv8 model. Auto-downloads weights on first run (~6MB for nano)."""
        self.model = YOLO(YOLO_MODEL)

    def is_loaded(self) -> bool:
        return self.model is not None

    def detect(self, frame) -> dict:
        """
        Run detection on a single frame (numpy array from OpenCV).
        Returns crowd metrics dict.
        """
        if not self.is_loaded():
            self.load_model()

        results = self.model(frame, conf=YOLO_CONFIDENCE, verbose=False)

        # Count only 'person' class detections
        person_count = 0
        for result in results:
            for box in result.boxes:
                if int(box.cls[0]) == PERSON_CLASS_ID:
                    person_count += 1

        # Calculate density level
        if person_count <= DENSITY_THRESHOLDS["low"]:
            density_level = "low"
        elif person_count <= DENSITY_THRESHOLDS["moderate"]:
            density_level = "moderate"
        else:
            density_level = "high"

        # Density percentage (capped at 100, based on moderate threshold as "full")
        max_capacity = DENSITY_THRESHOLDS["moderate"] * 2
        density_percentage = min(round((person_count / max_capacity) * 100, 1), 100.0)

        # Estimated wait time
        estimated_wait = round(person_count * WAIT_TIME_PER_PERSON, 1)

        return {
            "person_count": person_count,
            "density_percentage": density_percentage,
            "density_level": density_level,
            "estimated_wait_minutes": estimated_wait,
        }


# Singleton instance
detector = CrowdDetector()
