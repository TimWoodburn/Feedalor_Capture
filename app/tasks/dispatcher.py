# app/tasks/dispatcher.py
import time
import os
from datetime import datetime, timedelta
from rq import Queue
from redis import Redis
from urllib.parse import urlparse
from app import create_app
from app.models.external_feed import db, ExternalFeed
from app.utils.logger import log_info, log_error, log_warning
from app.tasks.capture import capture_frame

QUEUE_NAME = "feed-tasks"

def get_redis_connection():
    url = os.getenv("REDIS_URL", "redis://localhost:6379")
    parsed = urlparse(url)
    return Redis(host=parsed.hostname, port=parsed.port)

def dispatcher_loop(interval=5):
    app = create_app()
    redis_conn = get_redis_connection()
    queue = Queue(QUEUE_NAME, connection=redis_conn)

    with app.app_context():
        log_info("[DISPATCHER] Starting dispatcher loop")

        while True:
            now = datetime.utcnow()
            feeds = db.session.query(ExternalFeed).all()

            for feed in feeds:
                if feed.is_capturing:
                    continue

                should_capture = False

                if feed.dispatch_mode == "schedule" and feed.capture_at_times:
                    wiggle_seconds = 30
                    last = feed.last_capture_at or datetime.min

                    for t in feed.capture_at_times:
                        try:
                            scheduled_time = datetime.strptime(t, "%H:%M:%S").time()
                            scheduled_dt = now.replace(hour=scheduled_time.hour, minute=scheduled_time.minute, second=scheduled_time.second, microsecond=0)

                            delta = abs((now - scheduled_dt).total_seconds())
                            recent = abs((last - scheduled_dt).total_seconds())

                            if delta <= wiggle_seconds and recent > wiggle_seconds:
                                should_capture = True
                                break
                        except ValueError:
                            log_warning(f"[DISPATCHER] Invalid time format in capture_at_times: {t}")


                elif feed.dispatch_mode == "interval" and feed.seconds_per_capture and feed.seconds_per_capture > 0:
                    last = feed.last_capture_at or datetime.min
                    next_capture_due = last + timedelta(seconds=feed.seconds_per_capture)
                    should_capture = now >= next_capture_due

                # feed.dispatch_mode == "disabled" → no capture

                if should_capture:
                    feed.is_capturing = True
                    queue.enqueue(capture_frame, feed.uuid)
                    log_info(f"[DISPATCHER] Scheduled capture for {feed.uuid}")


            db.session.commit()
            time.sleep(interval)

def start_dispatcher():
    dispatcher_loop()