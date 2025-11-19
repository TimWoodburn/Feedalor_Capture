from app.plugins.interface import DecoderInterface
import cv2
import numpy as np
import yt_dlp

class YouTubeDecoder(DecoderInterface):
    decoder_name = "youtube"

    @staticmethod
    def decode(url: str) -> np.ndarray:
        try:
            ydl_opts = {
                'format': 'best[ext=mp4]/best',
                'quiet': True,
                'noplaylist': True
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info_dict = ydl.extract_info(url, download=False)
                video_url = info_dict.get('url', None)
                if not video_url:
                    raise RuntimeError("Failed to extract video stream URL")

            cap = cv2.VideoCapture(video_url)
            ret, frame = cap.read()
            cap.release()

            if not ret:
                raise RuntimeError("Failed to capture frame from YouTube stream")
            return frame

        except Exception as e:
            raise RuntimeError(f"YouTubeDecoder error: {e}")
