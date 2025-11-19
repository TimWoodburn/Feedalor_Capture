# app/routes/feeds_api.py
from flask import Blueprint, request, jsonify, current_app, send_file
import os, glob, uuid as uuidlib
from app.models import db, ExternalFeed
from app.utils.logger import log_info, log_error, log_warning
from app.utils.time_utils import normalize_capture_times

bp = Blueprint("feeds_api", __name__)


@bp.route("/feeds/<uuid>/frames/<int:index>", methods=["GET"])
def get_frame(uuid, index):
    feed = ExternalFeed.query.filter_by(uuid=uuid).first()
    if not feed:
        log_error(f"[API] error: get_frame_count Feed not found")
        return jsonify({"error": "Feed not found"}), 404

    if index >= (feed.history_length or 1):        
        log_error(f"[API] Frame index exceeds history length: UUID={uuid} Index=({index})")
        return jsonify({"error": "Frame index exceeds history length"}), 400

    stills_dir = os.path.join(current_app.root_path, "static", "stills", uuid)
    offline_path = os.path.join(current_app.root_path, "static", "offline.jpg")
    files = sorted(glob.glob(os.path.join(stills_dir, f"{uuid}_*.jpg")), reverse=True)

    if index < len(files):
        return send_file(files[index])
    else:
        return send_file(offline_path)


@bp.route("/feeds", methods=["GET"])
def list_feeds():
    feeds = ExternalFeed.query.all()
    return jsonify([f.to_dict() for f in feeds]), 200


@bp.route("/feeds", methods=["POST"])
def add_feed():
    data = request.json
    required_fields = ["url", "title", "decoder_name"]
    if not data or not all(k in data for k in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        capture_at_times = data.get("capture_at_times")
        if capture_at_times is not None:
            capture_at_times = normalize_capture_times(capture_at_times)

        dispatch_mode = data.get("dispatch_mode", "interval")
        if dispatch_mode not in ["interval", "schedule", "disabled"]:
            return jsonify({"error": "Invalid dispatch_mode"}), 400

        feed = ExternalFeed(
            uuid=str(uuidlib.uuid4()),
            url=data["url"],
            title=data["title"],
            decoder_name=data["decoder_name"],
            seconds_per_capture=data.get("seconds_per_capture"),
            capture_at_times=capture_at_times,
            dispatch_mode=dispatch_mode,
            history_length=data.get("history_length", 1),
            crop_x=data.get("crop_x"),
            crop_y=data.get("crop_y"),
            crop_width=data.get("crop_width"),
            crop_height=data.get("crop_height"),
            crop_active=data.get("crop_active"),

            # New EXIF fields
            gps_latitude=data.get("gps_latitude"),
            gps_longitude=data.get("gps_longitude"),
            gps_img_direction=data.get("gps_img_direction"),
            gps_img_direction_ref=data.get("gps_img_direction_ref"),
        )

        db.session.add(feed)
        db.session.commit()
        return jsonify(feed.to_dict()), 201

    except ValueError as e:
        return jsonify({"error": str(e)}), 400



@bp.route("/feeds/<uuid>", methods=["GET"])
def get_feed(uuid):
    feed = ExternalFeed.query.filter_by(uuid=uuid).first()
    if not feed:
        return jsonify({"error": "Feed not found"}), 404
    return jsonify(feed.to_dict()), 200


@bp.route("/feeds/<uuid>", methods=["PUT"])
def update_feed(uuid):
    feed = ExternalFeed.query.filter_by(uuid=uuid).first()
    if not feed:
        return jsonify({"error": "Feed not found"}), 404

    data = request.json
    try:
        for field in [
            "title", "seconds_per_capture", "decoder_name", "history_length",
            "crop_x", "crop_y", "crop_width", "crop_height", "crop_active",
            "gps_latitude", "gps_longitude", "gps_img_direction", "gps_img_direction_ref"
        ]:
            if field in data:
                setattr(feed, field, data[field])

        if "capture_at_times" in data:
            capture_at_times = data["capture_at_times"]
            if capture_at_times is not None:
                capture_at_times = normalize_capture_times(capture_at_times)
            feed.capture_at_times = capture_at_times

        if "dispatch_mode" in data:
            if data["dispatch_mode"] not in ["interval", "schedule", "disabled"]:
                return jsonify({"error": "Invalid dispatch_mode"}), 400
            feed.dispatch_mode = data["dispatch_mode"]

        db.session.commit()
        return jsonify(feed.to_dict()), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400



@bp.route("/feeds/<uuid>", methods=["DELETE"])
def delete_feed(uuid):
    feed = ExternalFeed.query.filter_by(uuid=uuid).first()
    if not feed:
        return jsonify({"error": "Feed not found"}), 404

    stills_dir = os.path.join(current_app.root_path, "static", "stills", uuid)
    latest_file = os.path.join(current_app.root_path, "static", "stills", f"{uuid}.jpg")
    if os.path.exists(stills_dir):
        for f in glob.glob(os.path.join(stills_dir, f"{uuid}_*.jpg")):
            os.remove(f)
        os.rmdir(stills_dir)
    if os.path.exists(latest_file):
        os.remove(latest_file)

    db.session.delete(feed)
    db.session.commit()
    return jsonify({"message": "Feed deleted"}), 200


@bp.route("/feeds/backup", methods=["GET"])
def backup_feeds():
    feeds = ExternalFeed.query.all()
    backup = [
        {
            "uuid": f.uuid,
            "url": f.url,
            "title": f.title,
            "decoder_name": f.decoder_name,
            "seconds_per_capture": f.seconds_per_capture,
            "capture_at_times": f.capture_at_times,
            "dispatch_mode": f.dispatch_mode,
            "history_length": f.history_length,
            "crop_x": f.crop_x,
            "crop_y": f.crop_y,
            "crop_width": f.crop_width,
            "crop_height": f.crop_height,
            "gps_latitude": f.gps_latitude,
            "gps_longitude": f.gps_longitude,
            "gps_img_direction": f.gps_img_direction,
            "gps_img_direction_ref": f.gps_img_direction_ref,
        }
        for f in feeds
    ]
    return jsonify(backup), 200



@bp.route("/feeds/restore", methods=["POST"])
def restore_feeds():
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({"error": "Restore payload must be a list of feeds."}), 400

        seen_uuids = set()
        for feed in data:
            uuid_val = feed.get("uuid")
            if not uuid_val:
                return jsonify({"error": "Missing uuid in one or more feeds."}), 400
            if uuid_val in seen_uuids:
                return jsonify({"error": f"Duplicate UUID in restore data: {uuid_val}"}), 400
            seen_uuids.add(uuid_val)

        ExternalFeed.query.delete()
        db.session.commit()

        for feed in data:
            capture_at_times = feed.get("capture_at_times")
            if capture_at_times is not None:
                capture_at_times = normalize_capture_times(capture_at_times)

            dispatch_mode = feed.get("dispatch_mode", "interval")
            if dispatch_mode not in ["interval", "schedule", "disabled"]:
                dispatch_mode = "interval"  # fail-safe fallback

            new_feed = ExternalFeed(
                uuid=feed["uuid"],
                url=feed["url"],
                title=feed["title"],
                decoder_name=feed["decoder_name"],
                seconds_per_capture=feed.get("seconds_per_capture", 60),
                capture_at_times=capture_at_times,
                dispatch_mode=dispatch_mode,
                history_length=feed.get("history_length", 1),
                crop_x=feed.get("crop_x"),
                crop_y=feed.get("crop_y"),
                crop_width=feed.get("crop_width"),
                crop_height=feed.get("crop_height"),
                crop_active=feed.get("crop_active", False),

                # EXIF metadata fields
                gps_latitude=feed.get("gps_latitude"),
                gps_longitude=feed.get("gps_longitude"),
                gps_img_direction=feed.get("gps_img_direction"),
                gps_img_direction_ref=feed.get("gps_img_direction_ref")
            )
            db.session.add(new_feed)

        db.session.commit()
        return jsonify({"message": f"Restored {len(data)} feeds successfully."}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400



@bp.route("/feeds", methods=["DELETE"])
def delete_all_feeds():
    feeds = ExternalFeed.query.all()
    deleted = 0

    for feed in feeds:
        stills_dir = os.path.join(current_app.root_path, "static", "stills", feed.uuid)
        latest_file = os.path.join(current_app.root_path, "static", "stills", f"{feed.uuid}.jpg")

        try:
            if os.path.exists(stills_dir):
                for f in glob.glob(os.path.join(stills_dir, f"{feed.uuid}_*.jpg")):
                    os.remove(f)
                os.rmdir(stills_dir)

            if os.path.exists(latest_file):
                os.remove(latest_file)

        except Exception as e:
            log_warning(f"[API] Failed to delete files for feed {feed.uuid}: {e}")

        db.session.delete(feed)
        deleted += 1

    db.session.commit()
    log_info(f"[API] Deleted {deleted} feeds and associated stills.")
    return jsonify({"message": f"{deleted} feeds deleted"}), 200
