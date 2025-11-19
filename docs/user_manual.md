# Feedalor Capture User Manual

**Version:** 1.5.0-IOC  
**Audience:** End users operating the system through the web interface  
**Scope:** Covers usage of the web interface to view, manage, and monitor CCTV still capture feeds.  
**Excludes:** Installation, deployment, and advanced system configuration.

---

## Table of Contents

- [Feedalor Capture User Manual](#feedalor-capture-user-manual)
  - [Table of Contents](#table-of-contents)
  - [1. Introduction](#1-introduction)
  - [2. System Overview](#2-system-overview)
  - [3. Dashboard Walkthrough](#3-dashboard-walkthrough)
  - [4. Working with Feeds](#4-working-with-feeds)
    - [4.1 Viewing Feed Status](#41-viewing-feed-status)
    - [4.2 Adding a Feed](#42-adding-a-feed)
    - [4.3 Editing a Feed](#43-editing-a-feed)
    - [4.4 Deleting a Feed](#44-deleting-a-feed)
  - [5. Grid Views](#5-grid-views)
    - [5.1 Standard Grid](#51-standard-grid)
    - [5.2 Custom Grid](#52-custom-grid)
  - [6. Feed Viewer](#6-feed-viewer)
  - [7. Engineering Page](#7-engineering-page)
  - [8. Log Viewer](#8-log-viewer)
  - [9. Best Practices](#9-best-practices)
  - [10. Troubleshooting](#10-troubleshooting)
  - [11. Glossary](#11-glossary)

---

## 1. Introduction

Welcome to Feedalor Capture, a web-based system for capturing, managing, and visualizing still frames from CCTV and MJPEG-compatible feeds.

*Insert system branding screenshot here*

---

## 2. System Overview

Feedalor Capture operates in real time and supports scheduled or interval-based captures. Each feed is represented as a unique tile with its own status, image history, and metadata.

- Supports EXIF metadata embedding
- Provides dashboard summary and individual feed access
- Offers custom and standard grid views

*Insert system architecture diagram here*

---

## 3. Dashboard Walkthrough

Upon logging in or loading the interface, you’ll see:

- **Top Bar**: Shows system status and time
- **Summary Bar**: Gives a quick overview of active feeds and failures
- **Control Panel**: Search, filter, add, or remove feeds
- **Feed Table**: List of all configured feeds with interactive controls

*Insert labeled UI screenshot here*

---

## 4. Working with Feeds

### 4.1 Viewing Feed Status

Each row in the feed table shows:
- Feed title and UUID
- Decoder and capture mode
- Last capture time
- Status indicator (live, offline, or error)

*Insert screenshot of feed table highlighting status icons*

### 4.2 Adding a Feed

Click **"+ Add Feed"**, then provide:
- URL to the video stream
- Title
- Capture mode and interval or schedule
- Decoder name

*Insert screenshot of Add Feed modal*

### 4.3 Editing a Feed

Click the edit icon on a feed row to update:
- Title, URL, or decoder
- Capture settings
- GPS metadata or crop region (if applicable)

*Insert screenshot of Edit Feed modal with crop and GPS fields*

### 4.4 Deleting a Feed

- Select one or more feeds using checkboxes
- Click **"Delete Selected"** and confirm

---

## 5. Grid Views

### 5.1 Standard Grid

Access via `/standard_grid`  
Displays **all active feeds** in a fullscreen grid layout that auto-refreshes every 10 seconds.

- Tiles are scaled to fit
- Updated images fade in
- Useful for wall-mounted displays

*Insert screenshot of standard grid layout*

### 5.2 Custom Grid

Select feeds in the table, then click **"View in Grid"**.

- Opens a grid with only selected feeds
- Uses query string with UUIDs
- Grid behaves like the standard grid, with auto-refresh and fade-in

*Insert screenshot of custom grid*

---

## 6. Feed Viewer

Click a feed title to open its detailed view.

- Shows large still image
- Displays frame history with a slider
- EXIF timestamp and metadata shown
- Optional region crop overlay

*Insert screenshot of Feed Viewer modal*

---

## 7. Engineering Page

Access via `/engineering`

Features:
- Redis queue status
- Decoder registry
- Feed metadata table (sortable, filterable columns)
- Live file index from static directory
- Export/import feed configurations

*Insert screenshot of Engineering dashboard*

---

## 8. Log Viewer

Access via **"View Application Log"** from Engineering page.

- Shows last 1000 log lines
- Auto-refreshes every 10s (can be paused)
- Download full log

*Insert screenshot of log viewer page*

---

## 9. Best Practices

- Avoid overlapping feed UUIDs when restoring backups
- Use GPS metadata for location-aware EXIF tagging
- Keep capture intervals reasonable (15s or more) to reduce system load
- Use standard grid for status boards and diagnostics

---

## 10. Troubleshooting

| Symptom                        | Suggested Action                         |
|-------------------------------|------------------------------------------|
| Feed shows black or stale tile| Check feed URL or decoder; reload viewer|
| Grid stops refreshing         | Check browser console and system logs    |
| Log viewer is blank           | Confirm `app.log` exists and is writable |
| Unable to add feed            | Verify URL and decoder compatibility     |

---

## 11. Glossary

- **UUID**: Unique identifier assigned to each feed
- **Decoder**: Logic module used to fetch and interpret a video stream
- **EXIF**: Metadata embedded in JPEG images
- **Crop Region**: A bounding box used to isolate a portion of the image for capture
- **Capture Mode**: Defines whether frames are pulled by interval or schedule

---
