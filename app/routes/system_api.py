# app/routes/system_api.py
import os
import humanize
from flask import Blueprint, current_app, jsonify
from app.utils.logger import log_info, log_warning, log_error

bp = Blueprint("system_api", __name__)

@bp.route("/health", methods=["GET"])
def health_check():
    try:
        static_path = os.path.join(current_app.root_path, "static")
        total_size = 0
        total_files = 0

        for root, dirs, files in os.walk(static_path):
            for file in files:
                full_path = os.path.join(root, file)
                try:
                    stat = os.stat(full_path)
                    total_size += stat.st_size
                    total_files += 1
                except FileNotFoundError:
                    log_warning(f"[HEALTH] Skipped disappearing file: {full_path}")

        log_info(f"[HEALTH] static/ scanned: {total_files} files, {total_size} bytes")

        return jsonify({
            "status": "ok",
            "static_file_count": total_files,
            "static_total_size_bytes": total_size,
            "static_total_size_human": humanize.naturalsize(total_size, binary=True)
        }), 200

    except Exception as e:
        log_error(f"[HEALTH] Exception during health check: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
