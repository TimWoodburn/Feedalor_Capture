# app/utils/logger.py

import os
import logging
from logging.handlers import RotatingFileHandler

LOG_FILE_PATH = "/app/db/app.log"  # Keep logs in the volume
MAX_LOG_SIZE_MB = int(os.getenv("MAX_LOG_SIZE_MB", "10"))
MAX_LOG_SIZE_BYTES = MAX_LOG_SIZE_MB * 1024 * 1024


# from app.utils.logger import log_info, log_warning, log_error
# log_info("Feed capture started.")
# log_error("Failed to connect to feed.")
#
# Engineering log page 
# http://<server>:5001/engineering/log



# Set up logger
logger = logging.getLogger("CCTVLogger")
logger.setLevel(logging.DEBUG)

# Only attach handler once
if not logger.handlers:
    handler = RotatingFileHandler(
        LOG_FILE_PATH,
        maxBytes=MAX_LOG_SIZE_BYTES,
        backupCount=1
    )
    formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s', "%Y-%m-%d %H:%M:%S")
    handler.setFormatter(formatter)
    logger.addHandler(handler)

def log_info(message):
    logger.info(message)

def log_warning(message):
    logger.warning(message)

def log_error(message):
    logger.error(message)

def get_recent_logs(lines=1000):
    """Read last n lines of the main log file."""
    if not os.path.exists(LOG_FILE_PATH):
        return ["(No log file found)"]

    with open(LOG_FILE_PATH, "r") as f:
        content = f.readlines()

    return content[-lines:]
