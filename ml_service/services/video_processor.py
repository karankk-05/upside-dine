"""
Grabs frames from camera feeds (RTSP, HTTP MJPEG, or local webcam).
"""
import cv2
import logging

logger = logging.getLogger(__name__)


def grab_frame(feed_url: str):
    """
    Grab a single frame from a video feed.

    Supports:
      - HTTP MJPEG: http://192.168.1.5:8080/video (IP Webcam app)
      - RTSP: rtsp://192.168.1.5:8080/h264_ulaw.sdp
      - Local webcam: "0" (string of integer device index)
      - Video file: /path/to/video.mp4

    Returns:
        numpy array (BGR frame) or None on failure.
    """
    try:
        # Local webcam: convert "0" → int 0
        source = int(feed_url) if feed_url.isdigit() else feed_url
        cap = cv2.VideoCapture(source)

        if not cap.isOpened():
            logger.error(f"Cannot open feed: {feed_url}")
            return None

        ret, frame = cap.read()
        cap.release()

        if not ret or frame is None:
            logger.error(f"Failed to grab frame from: {feed_url}")
            return None

        return frame

    except Exception as e:
        logger.error(f"Error grabbing frame from {feed_url}: {e}")
        return None


def grab_frame_as_jpeg(feed_url: str) -> bytes | None:
    """Grab a frame and encode as JPEG bytes (for snapshot endpoint)."""
    frame = grab_frame(feed_url)
    if frame is None:
        return None
    success, buffer = cv2.imencode(".jpg", frame)
    return buffer.tobytes() if success else None
