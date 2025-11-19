from app.models.external_feed import db, ExternalFeed
from flask import Flask
import json
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////app/db/externalfeeds.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

    if os.path.exists("app/utils/dev_feeds.json"):
        with open("app/utils/dev_feeds.json") as f:
            feeds = json.load(f)
            for feed in feeds:
                new_feed = ExternalFeed(
                    uuid=feed["uuid"],
                    title=feed["title"],
                    url=feed["url"],
                    decoder_name=feed.get("decoder_name"),
                    seconds_per_capture=feed.get("seconds_per_capture", 60),
                    history_length=feed.get("history_length", 1),
                    crop_x=feed.get("crop_x"),
                    crop_y=feed.get("crop_y"),
                    crop_width=feed.get("crop_width"),
                    crop_height=feed.get("crop_height"),
                    crop_active=feed.get("crop_active", False),
                    last_capture_at=None,
                    last_failed_at=None,
                    capture_at_times=feed.get("capture_at_times"),
                    dispatch_mode=feed.get("dispatch_mode", "interval"),
                    is_capturing=False,
                    gps_latitude=feed.get("gps_latitude"),
                    gps_longitude=feed.get("gps_longitude"),
                    gps_img_direction=feed.get("gps_img_direction"),
                    gps_img_direction_ref=feed.get("gps_img_direction_ref")
                )
                db.session.add(new_feed)
            db.session.commit()
            print(f"Loaded {len(feeds)} dev feeds.")