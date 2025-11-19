# Developer Guide: Writing Plugins for CFeedalor Capture

_Last updated: May 2025_

## Overview

Plugins, called **decoders**, allow you to extract a still image from any external source (e.g., camera stream, webpage, API). Each decoder is a **Python class** that inherits from `DecoderInterface` and provides at least one required method.

---

## 🔌 What is a Decoder?

A **decoder** is a stateless class that returns a still image (OpenCV/numpy array) when asked.

It must:

- Inherit `DecoderInterface`
- Define a class attribute `decoder_name`
- Implement a `@staticmethod decode(url: str) -> np.ndarray`

Optionally, it can implement:

- `@staticmethod get_metadata(url: str) -> dict` _(stub allowed)_

### Minimal Example

```python
import cv2
import numpy as np
from app.plugins.interface import DecoderInterface

class BasicDecoder(DecoderInterface):
    decoder_name = "basic"

    @staticmethod
    def decode(url):
        cap = cv2.VideoCapture(url)
        ret, frame = cap.read()
        cap.release()
        if not ret:
            raise Exception("Failed to decode frame")
        return frame

    @staticmethod
    def get_metadata(url):
        return {"note": "Basic MJPEG stream, no extra metadata."}
```

---

## Where to Place Decoders

Add your decoder file in:
```
/app/plugins/
```

Use lowercase filenames like `snapshot.py`, `stream_basic.py`, etc.

Do **not** modify `__init__.py` — all plugins are discovered dynamically.

---

## Runtime Behavior

Decoders are registered at runtime during app creation.

- `register_decoders()` introspects all `.py` files in `plugins/`
- Finds classes that subclass `DecoderInterface`
- Registers them in the global `decoders` dictionary (name → class)

```python
# app.plugins.registry.py

from app.plugins.interface import DecoderInterface

# Global registry
# decoders["youtube"] = YouTubeDecoder

# ...called at app startup
```

---

## get_metadata()

This optional method can:
- Validate the source
- Provide human-readable info for users
- Fetch pre-capture info (e.g., video title, resolution)

```python
@staticmethod
def get_metadata(url):
    return {"title": "Demo Feed", "status": "ok"}
```

If not implemented, the system will fallback to a stub.

---

## Plugin Guidelines

| Rule                             | Why                                           |
|----------------------------------|-----------------------------------------------|
| Stateless                        | Makes them safe for multi-threading/queueing |
| Raise on failure                 | Log problems, don't silently fail            |
| Use short timeouts               | Avoid hanging tasks                          |
| Accept a single `url` argument   | Keeps dispatcher generic                     |
| Use only built-in or declared deps | Avoid bloating the container               |

---

## Testing

Use `/api/feeds/test-decoder` route to test new decoders:
```json
{
  "decoder_name": "youtube",
  "url": "https://youtube.com/xyz"
}
```

You should get back:
```json
{
  "metadata": { "title": "..." }
}
```

---

## Don't Do This

- Don’t store persistent internal state
- Don’t reference Flask globals (`current_app`) inside decoders
- Don’t hardcode sensitive keys or tokens

---

## Examples You Can Copy

- `basic.py` – Reads from a raw stream URL
- `webpage_snapshot_basic.py` – Screenshots a webpage
- `youtube.py` – Uses `pytube` to grab a still
- `api_route.py` – Calls a JSON API and renders a visual snapshot

---

## 🔮 Future Enhancements (Planned)

| Feature                 | Description                             |
|-------------------------|-----------------------------------------|
| Rate limiting           | Shared across decoders of same provider |
| Secrets/config manager  | For tokens like YouTube API keys        |
| Decoder sandboxing      | To isolate risky imports                |
| Multi-stage decoding    | Capture → Filter → Annotate             |

---

## Need Help?
- Check logs for `[DECODER]` lines
- Ask ChatGPT for safe stubs or wrappers
- Keep it simple. One decoder = one purpose

---

_Thanks for contributing to Feedalor Capture 
