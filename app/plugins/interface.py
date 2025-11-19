# app/plugins/interface.py

from abc import ABC, abstractmethod
import numpy as np

class DecoderInterface(ABC):
    """
    Abstract base class for decoder plugins.
    Every decoder must define:
      - a string `decoder_name` (class-level or property)
      - a static method `decode(url: str) -> np.ndarray`
    """

    decoder_name: str

    @staticmethod
    @abstractmethod
    def decode(url: str) -> np.ndarray:
        pass

    @staticmethod
    def get_metadata(url: str) -> dict:
        """
        Optional static method. Returns metadata about the URL or decoder result.
        Decoders can override this to provide format info, dimensions, etc.
        """
        return {
            "status": "ok",
            "note": "No metadata provided by this decoder."
        }
