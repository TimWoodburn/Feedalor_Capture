from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

from uuid import uuid4


db = SQLAlchemy()

class ExternalFeed(db.Model):
    __tablename__ = 'external_feeds'

    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String, unique=True, nullable=False)
    title = db.Column(db.String, nullable=False)
    url = db.Column(db.String, nullable=False)
    decoder_name = db.Column(db.String, nullable=True)
    seconds_per_capture = db.Column(db.Integer, default=60)
    history_length = db.Column(db.Integer, default=1)
    crop_x = db.Column(db.Integer, nullable=True)
    crop_y = db.Column(db.Integer, nullable=True)
    crop_width = db.Column(db.Integer, nullable=True)
    crop_height = db.Column(db.Integer, nullable=True)
    crop_active = db.Column(db.Boolean, default=False)
    last_capture_at = db.Column(db.DateTime, nullable=True)
    last_failed_at = db.Column(db.DateTime, nullable=True)
    capture_at_times = db.Column(db.JSON, nullable=True)
    dispatch_mode = db.Column(db.String, default='interval')
    is_capturing = db.Column(db.Boolean, default=False)

    gps_latitude = db.Column(db.Float, nullable=True)
    gps_longitude = db.Column(db.Float, nullable=True)
    gps_img_direction = db.Column(db.Float, nullable=True)
    gps_img_direction_ref = db.Column(db.String, nullable=True)  # Always 'T'

    def to_dict(self):
        return {
            "id": self.id,
            "uuid": self.uuid,
            "title": self.title,
            "url": self.url,
            "decoder_name": self.decoder_name,
            "seconds_per_capture": self.seconds_per_capture,
            "history_length": self.history_length,
            "crop_x": self.crop_x,
            "crop_y": self.crop_y,
            "crop_width": self.crop_width,
            "crop_height": self.crop_height,
            "crop_active": self.crop_active,
            "last_capture_at": self.last_capture_at.isoformat() if self.last_capture_at else None,
            "last_failed_at": self.last_failed_at.isoformat() if self.last_failed_at else None,
            "capture_at_times": self.capture_at_times,
            "dispatch_mode": self.dispatch_mode,
            "is_capturing": self.is_capturing,
            "gps_latitude": self.gps_latitude,
            "gps_longitude": self.gps_longitude,
            "gps_img_direction": self.gps_img_direction,
            "gps_img_direction_ref": self.gps_img_direction_ref
        }