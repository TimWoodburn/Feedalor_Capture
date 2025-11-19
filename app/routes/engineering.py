# app/routes/engineering.py
import os
import glob
import time
import humanize
import redis
from flask import Blueprint, render_template, current_app, send_file
from app.models import ExternalFeed, db
from app.plugins.registry import decoders
from rq import Queue
from datetime import datetime, timezone
from app.utils.logger import get_recent_logs

bp = Blueprint("engineering", __name__)

@bp.route("/engineering")
def engineering_page():
    static_path = os.path.join(current_app.root_path, "static")

    # System Info
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    redis_status = "Unavailable"
    job_count = 0
    try:
        r = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
        r.ping()
        redis_status = "Connected"
        job_count = len(Queue("feed-tasks", connection=r))
    except:
        pass

    # Feeds
    raw_feeds = ExternalFeed.query.all()
    feed_rows = []


    for f in raw_feeds:
        d = f.to_dict()
        d["crop_area"] = f"x={f.crop_x or 0}, y={f.crop_y or 0}, w={f.crop_width or 0}, h={f.crop_height or 0}"
        del d["crop_x"]
        del d["crop_y"]
        del d["crop_width"]
        del d["crop_height"]
        feed_rows.append(d)

        feed_columns = ["uuid"] + [
            c for c in list(feed_rows[0].keys())
            if c != "uuid" and c not in ("crop_x", "crop_y", "crop_width", "crop_height")
        ]

        if "crop_area" not in feed_columns:
            feed_columns.append("crop_area")

    # Feed Stats
    feed_stats = []
    for feed in raw_feeds:
        history_dir = os.path.join(current_app.root_path, "static", "stills", feed.uuid)
        pattern = os.path.join(history_dir, f"{feed.uuid}_*.jpg")
        images = glob.glob(pattern)
        image_count = len(images)

        timestamps = [os.path.getmtime(img) for img in images]
        if len(timestamps) >= 2:
            avg_delay = round((max(timestamps) - min(timestamps)) / (len(timestamps) - 1), 1)
        else:
            avg_delay = "n/a"

        latest_file = os.path.join(current_app.root_path, "static", "stills", f"{feed.uuid}.jpg")
        is_offline = False
        try:
            is_offline = os.path.samefile(latest_file, os.path.join(current_app.root_path, "static", "offline.jpg"))
        except:
            pass

        feed_stats.append({
            "uuid": feed.uuid,
            "image_count": image_count,
            "is_offline": is_offline,
            "avg_delay": avg_delay
        })




    # File Index
    file_index = []
    for root, dirs, files in os.walk(static_path):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, static_path)
            stat = os.stat(full_path)

            file_index.append({
                "name": rel_path,
                "modified": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
                "size": stat.st_size,
                "url": f"/static/{rel_path.replace(os.sep, '/')}"
            })

    file_index.sort(key=lambda f: f["modified"], reverse=True)

    # Orphan detection
    valid_uuids = {f.uuid for f in raw_feeds}
    seen_collections = set()

    for entry in file_index:
        parts = entry["name"].split('/')
        if parts[0] == "stills":
            if len(parts) == 2:
                candidate = parts[1].split(".")[0]
            elif len(parts) > 2:
                candidate = parts[1]
            else:
                continue

            if candidate != "offline" and candidate not in valid_uuids:
                seen_collections.add(candidate)

    orphaned_count = len(seen_collections)

    return render_template("engineering.html",
                           now=now,
                           feeds=feed_rows,
                           feed_columns=feed_columns,
                           decoders=list(decoders.keys()),
                           redis_status=redis_status,
                           job_count=job_count,
                           file_index=file_index,
                           orphaned_count=orphaned_count,
                           feed_stats=feed_stats)


@bp.route("/engineering/log")
def view_log():
    logs = get_recent_logs(1000)
    return render_template("view_log.html", logs=logs)


@bp.route('/engineering/log/download')
def download_log():
    log_file_path = os.getenv('LOG_FILE_PATH', '/app/db/app.log')
    if os.path.exists(log_file_path):
        return send_file(log_file_path, as_attachment=True, download_name='cctv_still_grab_log.txt')
    else:
        return "Log file not found", 404


