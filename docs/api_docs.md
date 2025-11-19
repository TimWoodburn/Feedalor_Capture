
# Feedalor Capture API Documentation

Welcome to the **Feedalor Capture** API. This system manages a collection of CCTV feeds and captures still images based on configurable update intervals.

---

## Base URL

```http
http://<host>:5001/api
```

---

## Endpoints

### Health Check

Check server status.

```http
GET /api/health
```

**Response**
```json
{
  "status": "ok"
}
```

---

### Feed Management

#### List Feeds

```http
GET /api/feeds
```

Returns all configured feeds.

#### Add New Feed

```http
POST /api/feeds
```

**Request Body**
```json
{
  "url": "http://example.com/cam.jpg",
  "title": "Lobby Cam",
  "decoder_name": "single_frame",
  "seconds_per_capture": 10,
  "history_length": 3
}
```

**Note:** UUID will be auto-generated.

#### 🛠️ Update Feed

```http
PUT /api/feeds/<uuid>
```

**Request Body (partial updates supported)**
```json
{
  "title": "Front Door Updated",
  "decoder_name": "basic",
  "seconds_per_capture": 15
}
```

#### Delete Feed

```http
DELETE /api/feeds/<uuid>
```

Deletes a single feed and associated images.

#### Delete All Feeds

```http
DELETE /api/feeds
```

Deletes **all feeds and all images**.

---

### Decoder Plugins

#### List Available Decoders

```http
GET /api/decoders
```

**Response**
```json
["basic", "single_frame"]
```

---

### Previews and Frame Capture

#### Trigger Manual Preview

```http
GET /api/feeds/<uuid>/preview
```

Queues a one-time capture job for this feed.

---

### Frame Access and History

#### Get Frame Metadata

```http
GET /api/feeds/<uuid>/metadata
```

**Response**
```json
{
  "uuid": "abc123",
  "last_capture_time": "2025-04-23 12:30:00",
  "is_offline": false
}
```

#### Available Frame Count

```http
GET /api/feeds/<uuid>/availableframes
```

Returns number of historical frames that can be requested.

#### Retrieve a Specific Frame

```http
GET /api/feeds/<uuid>/frames/<index>
```

Where `<index>` is `0` for latest, up to `(availableframes - 1)` for older.

If not enough frames are available, the server will return `offline.jpg`.

---

### Backup and Restore

#### Backup Feed List

```http
GET /api/feeds/backup
```

Returns full JSON representation of feed definitions (including UUIDs).

#### Restore Feed List

```http
POST /api/feeds/restore
```

**Request Body**
```json
[
  {
    "uuid": "abc123",
    "url": "http://example.com/feed1.jpg",
    "title": "Feed A",
    "decoder_name": "single_frame",
    "seconds_per_capture": 10,
    "history_length": 2
  }
]
```

Restores the entire feed list. Will **wipe all existing feeds**. Will error on duplicate UUIDs.

---

### Download All Frames

#### Download a Feed’s Captures as ZIP

```http
GET /api/feeds/<uuid>/download
```

Returns a `.zip` archive containing the latest still and all historical frames for the specified feed.

---

## Operational Flow

### Background Capture Process

- The dispatcher runs every second (or configurable `DISPATCH_INTERVAL`)
- Each feed is checked to determine if it's due for capture based on `seconds_per_capture`
- If the feed failed recently, it's retried every `FAILED_FEED_RETRY` seconds
- RQ handles dispatching the capture jobs
- Only `history_length` frames are stored per feed
- Old frames beyond `history_length` or timeout threshold are deleted automatically
- The latest image is always saved as `<uuid>.jpg` for direct referencing

---

## Frame Cleanup Logic

```python
cutoff = time.time() - (history_length * seconds_per_capture * 1.25)
if image_timestamp < cutoff:
    delete image
```

---

## Testing Tools

Use [Postman](https://www.postman.com/) with the provided collection:

 `feedalor_capture_postman_collection.json`

---

## Questions or Feature Ideas?

Consider expanding with:

- Frame timestamp overlays
- Authentication
- Live stream proxying
- Logs & stats
