#!/bin/bash
set -e

echo "[+] Feedalor Capture..."

# Wait for Redis to be ready
until nc -z redis 6379; do
  echo "[...] Waiting for Redis..."
  sleep 1
done

# Ensure the DB directory exists
mkdir -p /app/db

# Initialize DB if it doesn't exist
if [ ! -f /app/db/externalfeeds.db ]; then
  echo "[+] Initializing database and loading dev feeds..."
  PYTHONPATH=/app python3 app/utils/init_db.py
fi

# Launch RQ worker in background
echo "[+] Launching RQ worker..."
rq worker feed-tasks --url $REDIS_URL &

# Launch Dispatcher in background
echo "[+] Starting Dispatcher Loop..."
PYTHONPATH=/app python3 -c "from app.tasks.dispatcher import start_dispatcher; start_dispatcher(); import time; time.sleep(1e9)" &

# Start Flask server
echo "[+] Starting Flask server..."
cd /app
exec flask --app app run --host=0.0.0.0 --port=5001
