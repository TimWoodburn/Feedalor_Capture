# app/routes/capture_api.py
from flask import Blueprint, jsonify, send_file, request
import os
from glob import glob
from app.utils.logger import log_info
#from app.tasks.capture import preview_capture_task

bp = Blueprint("capture_api", __name__)

STILLS_DIR = "app/static/stills"

'''
@bp.route("/feeds/<uuid>/preview", methods=["POST"])
def preview_feed(uuid):
    log_info(f"[CAPTURE API] Preview requested for {uuid}")
    preview_capture_task(uuid)
    return jsonify({"message": f"Preview for feed {uuid} dispatched."}), 200
'''

@bp.route("/feeds/<uuid>/frames", methods=["GET"])
def list_frames(uuid):
    feed_dir = os.path.join(STILLS_DIR, uuid)
    if not os.path.exists(feed_dir):
        return jsonify({"count": 0}), 200

    frames = glob(os.path.join(feed_dir, f"{uuid}_*.jpg"))
    return jsonify({"count": len(frames)}), 200

@bp.route("/feeds/<uuid>/frames/<int:index>", methods=["GET"])
def get_frame(uuid, index):
    feed_dir = os.path.join(STILLS_DIR, uuid)
    frames = sorted(glob(os.path.join(feed_dir, f"{uuid}_*.jpg")))

    if index < 0 or index >= len(frames):
        return jsonify({"error": "Frame not found."}), 404

    return send_file(frames[index], mimetype="image/jpeg")

@bp.route("/feeds/<uuid>/metadata", methods=["GET"])
def get_metadata(uuid):
    latest = os.path.join(STILLS_DIR, f"{uuid}.jpg")
    if not os.path.exists(latest):
        return jsonify({"error": "No capture available."}), 404

    size = os.path.getsize(latest)
    return jsonify({"bytes": size}), 200

@bp.route("/feeds/<uuid>/download", methods=["GET"])
def download_all_frames(uuid):
    from zipfile import ZipFile
    from io import BytesIO

    feed_dir = os.path.join(STILLS_DIR, uuid)
    frames = sorted(glob(os.path.join(feed_dir, f"{uuid}_*.jpg")))
    if not frames:
        return jsonify({"error": "No frames available."}), 404

    memory_file = BytesIO()
    with ZipFile(memory_file, 'w') as zipf:
        for frame_path in frames:
            arcname = os.path.basename(frame_path)
            zipf.write(frame_path, arcname=arcname)
    memory_file.seek(0)

    return send_file(memory_file, mimetype='application/zip', as_attachment=True, download_name=f"{uuid}_frames.zip")