from flask import Blueprint, render_template, request
from app.models import ExternalFeed
from sqlalchemy import or_

bp = Blueprint("gridview", __name__)

@bp.route("/standard_grid")
def standard_grid():
    return render_template("standard_grid.html")

@bp.route("/custom_grid")
def custom_grid():
    # Get comma-separated UUIDs from query string
    uuid_list = request.args.get("feeds", "")
    uuid_list = [u.strip() for u in uuid_list.split(",") if u.strip()]

    if not uuid_list:
        return "No feeds selected", 400

    # Fetch matching feeds from DB
    feeds = ExternalFeed.query.filter(ExternalFeed.uuid.in_(uuid_list)).all()

    # Prepare data for rendering
    feed_data = [
        {"uuid": f.uuid, "title": f.title, "last_capture_at": f.last_capture_at}
        for f in feeds
    ]

    return render_template("custom_grid.html", feeds=feed_data)
