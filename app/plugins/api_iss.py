import os
import json
import re
import requests
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
from dotenv import load_dotenv
from app.plugins.interface import DecoderInterface

FONT_PATH = os.path.join(
    os.path.dirname(__file__),
    "fonts",
    "dejavu-sans-ttf-2.37",
    "ttf",
    "DejaVuSans.ttf"
)

class ISSDecoder(DecoderInterface):
    decoder_name = "api_iss"

    @staticmethod
    def decode(url: str) -> np.ndarray:
        config = ISSDecoder.parse_iss_url(url)

        # Load API key
        load_dotenv(dotenv_path=".env.keys")
        api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        if not api_key:
            raise RuntimeError("GOOGLE_MAPS_API_KEY not set")

        # Get ISS location
        try:
            resp = requests.get("http://api.open-notify.org/iss-now.json", timeout=5)
            resp.raise_for_status()
            data = resp.json()
            lat = float(data["iss_position"]["latitude"])
            lon = float(data["iss_position"]["longitude"])
        except Exception as e:
            raise RuntimeError(f"ISS position fetch failed: {e}")

        # Request base map image from Google
        center_lat, center_lon = lat, lon
        zoom = config.get("zoom", 2)
        size = f"{config['image_size'][0]}x{config['image_size'][1]}"
        maptype = config.get("map_style", "roadmap")

        map_url = (
            "https://maps.googleapis.com/maps/api/staticmap"
            f"?center={center_lat},{center_lon}"
            f"&zoom={zoom}"
            f"&size={size}"
            f"&maptype={maptype}"
            f"&key={api_key}"
        )

        try:
            map_resp = requests.get(map_url, timeout=10)
            map_resp.raise_for_status()
            map_img = Image.open(BytesIO(map_resp.content)).convert("RGB")
        except Exception as e:
            raise RuntimeError(f"Google Maps image fetch failed: {e}")

        def latlon_to_pixel(lat, lon, zoom, width, height, center_lat, center_lon):
            TILE_SIZE = 256
            scale = 2 ** zoom

            def lon_to_x(lon):
                return (lon + 180.0) / 360.0 * scale * TILE_SIZE

            def lat_to_y(lat):
                lat_rad = np.radians(lat)
                return (
                    (1.0 - np.log(np.tan(lat_rad) + 1 / np.cos(lat_rad)) / np.pi) / 2.0
                    * scale * TILE_SIZE
                )

            center_x = lon_to_x(center_lon)
            center_y = lat_to_y(center_lat)
            target_x = lon_to_x(lon)
            target_y = lat_to_y(lat)

            dx = target_x - center_x
            dy = target_y - center_y

            x_pixel = width // 2 + int(dx)
            y_pixel = height // 2 + int(dy)
            return x_pixel, y_pixel

        draw = ImageDraw.Draw(map_img)
        x, y = latlon_to_pixel(lat, lon, zoom, map_img.width, map_img.height, center_lat, center_lon)
        draw.ellipse((x - 6, y - 6, x + 6, y + 6), fill="red")

        if config.get("show_latlon", True):
            try:
                font_size = config.get("font_size", 16)
                font_color = config.get("font_color", "red")
                font = ImageFont.truetype(FONT_PATH, size=font_size)
                label = f"Lat: {lat:.2f}, Lon: {lon:.2f}"
                draw.text((10, 10), label, fill=font_color, font=font)
            except Exception:
                pass

        return np.array(map_img)

    @staticmethod
    def parse_iss_url(url: str) -> dict:
        config = {
            "map_style": "roadmap",
            "zoom": 2,
            "show_latlon": True,
            "image_size": [800, 400],
            "font_size": 16,
            "font_color": "red"
        }

        if not url.startswith("ISS"):
            raise ValueError("Invalid ISS decoder URL. Must begin with 'ISS'")

        if ":" not in url:
            return config

        param_str = url.split(":", 1)[1]
        pattern = re.compile(r'''
            (\w+)\s*=\s*
            (\"[^\"]*\" | \[[^\]]*\] | [^,]+)
        ''', re.VERBOSE)

        for match in pattern.findall(param_str):
            key, val = match
            key = key.strip()
            val = val.strip()
            try:
                val_parsed = json.loads(val)
            except json.JSONDecodeError:
                val_parsed = val.strip('"')
            config[key] = val_parsed

        return config
