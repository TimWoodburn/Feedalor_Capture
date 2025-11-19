# Developer Guide: Frontend and Engineering Routes

## Overview

This document explains the responsibilities and structure of two special-purpose route files in the Flask backend:

- `app/routes/frontend.py` — serves the React frontend
- `app/routes/engineering.py` — exposes the engineering/debug interface

---

## 1. `frontend.py` – Serving the React App

### Purpose

Serves `index.html` and all associated static assets from the `static/frontend/` directory. This enables client-side routing via React Router and avoids 404s when deep-linking into React subpaths.

### Route Structure

```python
@bp.route("/")
def index():
    # Serves index.html for root
```

```python
@bp.route("/<path:path>")
def static_proxy(path):
    # Serves assets like JS/CSS/PNG from /static/frontend/*
    # Falls back to index.html on missing asset to support React Router
```

### Key Behavior

- Uses `send_file()` to return files based on path.
- Logs all frontend asset requests via `log_info()`.
- Gracefully falls back to `index.html` if a requested file is not found.

### Integration Details

- This route is mounted on `/` via the blueprint `frontend`.
- React builds are stored in `static/frontend/`.
- You must run `npm run build` in the frontend project and copy the result into `static/frontend/`.

---

## 2. `engineering.py` – Debug + File/Feed Viewer Page

### Purpose

Provides a lightweight engineering/debug interface to inspect feed configurations, statistics, captured stills, and application logs. Does not use React.

### Main Route: `/engineering`

### Rendered Page: `engineering.html`

Displays:

- Current UTC time
- Redis connection status and job queue count
- Decoder registry list
- Table of all feeds and metadata, including crop area
- Column visibility toggles above the feed table
- Live feed statistics (image count, average delay, offline status)
- Static file index for `/static/` with download links
- Orphaned feed detection (files in `stills/` with no matching UUID)

Includes JS for:

- Column toggling with localStorage state
- Client-side sortable tables

### Buttons

- **Backup Feeds**: triggers a download of current feed config
- **Restore Feeds**: uploads a file to restore feed config
- **View Application Log**: opens log viewer in new tab

---

## 3. Log Viewer Routes

### `/engineering/log`

- Renders `view_log.html`
- Shows most recent 1000 log lines
- Includes auto-refresh every 10s
- Includes "Pause Updates" toggle button

### `/engineering/log/download`

- Downloads the full log file
- Uses `LOG_FILE_PATH` environment variable (default: `/app/db/app.log`)
- Returns 404 if the file is missing

---

## 4. Relationship with React Frontend

While the React app does not use the engineering page directly, it shares key data via:

| React File         | Backend Route(s) Used                    |
|--------------------|------------------------------------------|
| `App.jsx`          | `/api/feeds`, `/api/health`, etc.        |
| `FeedViewerModal`  | `/feeds/<uuid>/frames/<index>`           |
| `TopBar`, `SummaryBar` | `/api/health`, `/api/feeds/summary` |
| `Engineering.html` | standalone Flask view                    |

> Engineering is kept separate from React for fast no-JS debugging.

---

## 5. Deployment Notes

- `static/frontend/` must contain the built React app (`npm run build`)
- Flask must serve static content from `current_app.root_path/static/...`
- Docker volumes must mount:
  - `static/stills/` for frame storage
  - `db/` for logs and backups
  - Any custom plugin directories

---

## 6. Summary for Maintainers

| File              | Role                          | Notes |
|-------------------|-------------------------------|-------|
| `frontend.py`     | Serves React app              | Fallback to `index.html` on 404s |
| `engineering.py`  | Diagnostics, feed and log viewer | Pure Flask/HTML |
| `engineering.html`| Static debug page             | JS for sorting, toggling, log viewing |
| `App.jsx`         | React entrypoint              | Uses RESTful `/api` calls |
| `view_log.html`   | Live log viewer               | Auto-refresh + pause toggle |
| `static/frontend/`| Built React app               | Rebuild required on UI changes |