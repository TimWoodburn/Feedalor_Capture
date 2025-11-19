import os
import io
import cv2
import numpy as np

USE_MEMORY = os.getenv("IN_MEMORY_STORAGE", "true").lower() == "true"
memory_store = {}

class ImageStore:
    @staticmethod
    def set(uuid: str, frame: np.ndarray):
        is_success, buffer = cv2.imencode(".jpg", frame)
        if not is_success:
            raise RuntimeError("Failed to encode image")

        if USE_MEMORY:
            memory_store[uuid] = buffer.tobytes()
        else:
            with open(f"app/static/ext_{uuid}.jpg", "wb") as f:
                f.write(buffer.tobytes())

    @staticmethod
    def get(uuid: str):
        if USE_MEMORY:
            return io.BytesIO(memory_store.get(uuid, b""))
        else:
            path = f"app/static/ext_{uuid}.jpg"
            if not os.path.exists(path):
                return None
            return open(path, "rb")
