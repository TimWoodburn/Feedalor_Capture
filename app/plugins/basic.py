from app.plugins.interface import DecoderInterface
import cv2
import numpy as np

class BasicDecoder(DecoderInterface):
    decoder_name = "basic"

    @staticmethod
    def decode(url: str) -> np.ndarray:
        cap = cv2.VideoCapture(url)
        ret, frame = cap.read()
        cap.release()
        if not ret:
            raise RuntimeError("Failed to capture frame")
        return frame


