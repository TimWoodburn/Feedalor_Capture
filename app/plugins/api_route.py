# app/plugins/api_route.py

from app.plugins.interface import DecoderInterface
import requests
import numpy as np
import cv2
import os
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv
import polyline
import hashlib
from datetime import datetime, timedelta

class API_Route_Decoder(DecoderInterface):
    decoder_name = "api_route"

    IMAGE_WIDTH = 800
    IMAGE_HEIGHT = 600
    MAP_TYPE = "roadmap"
    FONT_PATH = os.path.join(
        os.path.dirname(__file__),
        "fonts",
        "dejavu-sans-ttf-2.37",
        "ttf",
        "DejaVuSans.ttf"
    )

    CACHE_DIR = os.path.join(os.path.dirname(__file__), "cached_data", "api_route", "map_cache")
    TALLY_FILE = os.path.join(os.path.dirname(__file__), "cached_data", "api_route", "api_tally.txt")
    MAX_CACHE_AGE_DAYS = 7

    @staticmethod
    def _increment_api_tally():
        os.makedirs(os.path.dirname(API_Route_Decoder.TALLY_FILE), exist_ok=True)
        now = datetime.utcnow()
        key = now.strftime("%Y-%m")  # e.g. 2025-05
        tally = {}

        # Read existing tally
        if os.path.exists(API_Route_Decoder.TALLY_FILE):
            with open(API_Route_Decoder.TALLY_FILE, "r") as f:
                for line in f:
                    if ":" in line:
                        month, count = line.strip().split(":")
                        tally[month] = int(count)

        # Increment current month
        tally[key] = tally.get(key, 0) + 1

        # Write back
        with open(API_Route_Decoder.TALLY_FILE, "w") as f:
            for month, count in tally.items():
                f.write(f"{month}:{count}\n")

    @staticmethod
    def _prune_old_cache():
        if not os.path.exists(API_Route_Decoder.CACHE_DIR):
            return

        cutoff = datetime.utcnow() - timedelta(days=API_Route_Decoder.MAX_CACHE_AGE_DAYS)
        for fname in os.listdir(API_Route_Decoder.CACHE_DIR):
            fpath = os.path.join(API_Route_Decoder.CACHE_DIR, fname)
            if os.path.isfile(fpath):
                try:
                    mtime = datetime.utcfromtimestamp(os.path.getmtime(fpath))
                    if mtime < cutoff:
                        os.remove(fpath)
                except Exception:
                    continue

    @staticmethod
    def decode(url: str) -> np.ndarray:
        API_Route_Decoder._prune_old_cache()

        if not url.startswith("ROUTE:") or "->" not in url:
            raise ValueError("Expected format: ROUTE:ORIGIN->DESTINATION[;threshold=MINUTES]")

        route_part = url[len("ROUTE:"):].strip()
        route_only, *params = route_part.split(";")
        origin, destination = map(str.strip, route_only.split("->"))

        threshold_minutes = None
        for param in params:
            if param.startswith("threshold="):
                try:
                    threshold_minutes = int(param.split("=")[1])
                except ValueError:
                    raise ValueError("Invalid threshold value. Must be an integer.")

        load_dotenv(dotenv_path=".env.keys")
        api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        if not api_key:
            raise RuntimeError("GOOGLE_MAPS_API_KEY not set")

        directions_url = "https://maps.googleapis.com/maps/api/directions/json"
        params = {
            "origin": origin,
            "destination": destination,
            "departure_time": "now",
            "traffic_model": "best_guess",
            "key": api_key,
        }
        res = requests.get(directions_url, params=params)
        res.raise_for_status()
        API_Route_Decoder._increment_api_tally()

        data = res.json()
        if not data.get("routes"):
            raise RuntimeError("No route found between given postcodes")

        route_data = data["routes"][0]
        overview_polyline = route_data["overview_polyline"]["points"]
        leg = route_data["legs"][0]
        duration_traffic = leg.get("duration_in_traffic", leg["duration"])["text"]
        duration_traffic_sec = leg.get("duration_in_traffic", leg["duration"])["value"]
        duration_traffic_min = duration_traffic_sec // 60

        if threshold_minutes is not None and duration_traffic_min > threshold_minutes:
            path_color = "0xff0000ff"
            text_color = "red"
        else:
            path_color = "0x0000ffff"
            text_color = "black"

        os.makedirs(API_Route_Decoder.CACHE_DIR, exist_ok=True)
        key_string = overview_polyline + path_color
        cache_hash = hashlib.md5(key_string.encode()).hexdigest()
        cache_path = os.path.join(API_Route_Decoder.CACHE_DIR, f"{cache_hash}.jpg")

        if os.path.exists(cache_path):
            img = Image.open(cache_path).convert("RGB")
        else:
            static_map_url = (
                f"https://maps.googleapis.com/maps/api/staticmap"
                f"?size={API_Route_Decoder.IMAGE_WIDTH}x{API_Route_Decoder.IMAGE_HEIGHT}"
                f"&maptype={API_Route_Decoder.MAP_TYPE}"
                f"&path=color:{path_color}|weight:5|enc:{overview_polyline}"
                f"&markers=color:green%7Clabel:A%7C{origin}"
                f"&markers=color:red%7Clabel:B%7C{destination}"
                f"&key={api_key}"
            )
            map_res = requests.get(static_map_url)
            map_res.raise_for_status()
            API_Route_Decoder._increment_api_tally()

            img = Image.open(BytesIO(map_res.content)).convert("RGB")
            img.save(cache_path, "JPEG")

        draw = ImageDraw.Draw(img)
        font_size = 25
        try:
            font = ImageFont.truetype(API_Route_Decoder.FONT_PATH, font_size)
        except IOError:
            font = ImageFont.load_default()

        overlay_text = f"{origin} -> {destination}\nTime: {duration_traffic}"
        text_padding = 10
        text_lines = overlay_text.split("\n")
        text_width = max(font.getlength(line) for line in text_lines) + 2 * text_padding
        text_height = (font_size + 10) * len(text_lines) + 2 * text_padding

        draw.rectangle(
            [(10, 10), (10 + text_width, 10 + text_height)],
            fill=(255, 255, 255, 230)
        )

        for i, line in enumerate(text_lines):
            y = 10 + text_padding + i * (font_size + 10)
            draw.text((10 + text_padding, y), line, fill=text_color, font=font)

        return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
