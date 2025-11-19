from app.plugins.interface import DecoderInterface
import numpy as np
import cv2
import urllib.request

class SingleFrameDecoder(DecoderInterface):
    decoder_name = "single_frame"

    @staticmethod
    def decode(url: str) -> np.ndarray:
        try:
            with urllib.request.urlopen(url, timeout=10) as resp:
                image_data = resp.read()
                arr = np.asarray(bytearray(image_data), dtype=np.uint8)
                frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
                if frame is None:
                    raise ValueError("Image decoding failed")
                return frame
        except Exception as e:
            raise RuntimeError(f"Failed to load image from {url}: {e}")