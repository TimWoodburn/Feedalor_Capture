# app/tasks/capture.py
import os
import cv2
import glob
import time
import piexif
from datetime import datetime
from flask import current_app
from app.models.external_feed import db, ExternalFeed
from app.plugins.registry import get_decoder_by_name
from app.utils.logger import log_info, log_warning, log_error

def convert_to_dms_rational(deg_float):
    try:
        deg = int(deg_float)
        min_float = abs(deg_float - deg) * 60
        minute = int(min_float)
        sec_float = (min_float - minute) * 60
        sec = int(sec_float * 10000)
        return [(abs(deg), 1), (minute, 1), (sec, 10000)]
    except Exception as e:
        log_warning(f"[EXIF] Failed to convert to DMS: {deg_float} ({e})")
        return None

def build_exif(feed, now):
    try:
        exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}, "thumbnail": None}

        # Artist and UUID
        exif_dict["0th"][piexif.ImageIFD.Artist] = "Feedalor Capture"
        exif_dict["0th"][piexif.ImageIFD.ImageDescription] = feed.uuid

        # Title in UTF-16 with Unicode prefix
        if feed.title:
            comment = b"UNICODE\x00" + feed.title.encode("utf-16")[2:]  # skip BOM
            exif_dict["Exif"][piexif.ExifIFD.UserComment] = comment

        # Timestamp
        exif_dict["Exif"][piexif.ExifIFD.DateTimeOriginal] = now.strftime("%Y:%m:%d %H:%M:%S")

        # GPS
        if feed.gps_latitude is not None and feed.gps_longitude is not None:
            lat_ref = "N" if feed.gps_latitude >= 0 else "S"
            lon_ref = "E" if feed.gps_longitude >= 0 else "W"
            lat_dms = convert_to_dms_rational(feed.gps_latitude)
            lon_dms = convert_to_dms_rational(feed.gps_longitude)

            if lat_dms and lon_dms:
                exif_dict["GPS"][piexif.GPSIFD.GPSLatitudeRef] = lat_ref
                exif_dict["GPS"][piexif.GPSIFD.GPSLatitude] = lat_dms
                exif_dict["GPS"][piexif.GPSIFD.GPSLongitudeRef] = lon_ref
                exif_dict["GPS"][piexif.GPSIFD.GPSLongitude] = lon_dms
            else:
                log_warning(f"[EXIF] Invalid GPS DMS conversion for {feed.uuid}")

        if feed.gps_img_direction is not None:
            exif_dict["GPS"][piexif.GPSIFD.GPSImgDirectionRef] = "T"
            exif_dict["GPS"][piexif.GPSIFD.GPSImgDirection] = (int(feed.gps_img_direction * 100), 100)

        return piexif.dump(exif_dict)
    except Exception as e:
        log_error(f"[EXIF] Error building EXIF: {e}")
        return None

def capture_frame(feed_uuid):
    from app import create_app
    app = create_app()

    with app.app_context():
        log_info(f"[CAPTURE] Starting capture for {feed_uuid}")

        feed = db.session.query(ExternalFeed).filter_by(uuid=feed_uuid).first()
        if not feed:
            log_warning(f"[CAPTURE] Feed {feed_uuid} not found, skipping.")
            return

        DecoderClass = get_decoder_by_name(feed.decoder_name)
        if not DecoderClass:
            log_error(f"[CAPTURE] Decoder not found for feed {feed_uuid}")
            return

        try:
            frame = DecoderClass.decode(feed.url)

            now = datetime.utcnow()
            timestamp = now.strftime("%Y%m%d_%H%M%S")

            history_dir = os.path.join(current_app.root_path, "static", "stills", feed.uuid)
            latest_path = os.path.join(current_app.root_path, "static", "stills", f"{feed.uuid}.jpg")
            os.makedirs(history_dir, exist_ok=True)

            history_file = os.path.join(history_dir, f"{feed.uuid}_{timestamp}.jpg")

            # Save to temp file to inject EXIF
            temp_file = os.path.join(history_dir, f"temp_{feed.uuid}.jpg")
            cv2.imwrite(temp_file, frame)

            exif_bytes = build_exif(feed, now)
            if exif_bytes:
                piexif.insert(exif_bytes, temp_file, history_file)
                piexif.insert(exif_bytes, temp_file, latest_path)
            else:
                os.rename(temp_file, history_file)
                os.replace(history_file, latest_path)

            os.remove(temp_file)

            log_info(f"[CAPTURE] Frame saved with EXIF for {feed.uuid}")

            files = sorted(glob.glob(os.path.join(history_dir, f"{feed.uuid}_*.jpg")), reverse=True)

            if feed.dispatch_mode != "schedule":
                wiggle_factor = 1.5
                max_age = wiggle_factor * (feed.history_length or 1) * (feed.seconds_per_capture or 60)
                cutoff = time.time() - max_age

                for f in files:
                    if os.path.getmtime(f) < cutoff:
                        os.remove(f)
                        log_info(f"[CAPTURE] Pruned old frame max_age: {f}")

            files = sorted(glob.glob(os.path.join(history_dir, f"{feed.uuid}_*.jpg")), reverse=True)
            for f in files[feed.history_length:]:
                os.remove(f)
                log_info(f"[CAPTURE] Pruned old frame history_length: {f}")

            feed.last_capture_at = now
            feed.last_failed_at = None
            feed.is_capturing = False
            db.session.commit()

            print(f"[+] Saved frame for {feed.uuid}")

        except Exception as e:
            log_error(f"[CAPTURE] Exception during capture for {feed.uuid}: {e}")
            feed.last_failed_at = datetime.utcnow()
            feed.is_capturing = False
            db.session.commit()
