# app/routes/frontend.py

import os
from flask import Blueprint, send_file, current_app
from app.utils.logger import log_info, log_warning, log_error

bp = Blueprint('frontend', __name__)

@bp.route("/")
def index():
    log_info("[FRONTEND] Serving index.html for /")
    return send_file(
        os.path.join(current_app.root_path, "static", "frontend", "index.html")
    )

@bp.route("/<path:path>")
def static_proxy(path):    
    frontend_path = os.path.join(current_app.root_path, "static", "frontend", path)
    if os.path.exists(frontend_path):
        log_info(f"[FRONTEND] Serving asset: {path}")
        return send_file(frontend_path)
    else:
        log_error(f"[FRONTEND] Asset not found: {path}, serving fallback index.html")
        return send_file(
            os.path.join(current_app.root_path, "static", "frontend", "index.html")
        )
