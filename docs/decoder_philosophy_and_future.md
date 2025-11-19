# Decoder Philosophy and Future Vision – Feedalor Capture

_Last updated: May 2025_

---

## 🌍 Updated Long-Term Vision for Feedalor Capture

| Before                       | Now and Future                           |
|-----------------------------|------------------------------------------|
| CCTV Stream Grabber only    | Universal Visual Capture Engine          |

### New Mission:
> **Poll anything that changes visually over time.**  
> **Collect still frames representing external evolving worlds.**

This lightweight, frame-based model allows the platform to:
- Avoid video capture or continuous media storage
- Work across variable sources
- Remain simple and scalable

### Supported Use Cases:
- Traditional CCTV feeds
- Website monitoring
- Sensor or dashboard visualization
- Weather stations and public display scraping
- Data feed representation (e.g. maps, gauges, infographics)

All without changing the core architecture — _just plug in new decoders_.

---

## Decoder Philosophy

Decoders are **modular, stateless plugins** that allow the system to extract **still frames** from dynamic sources. They are deliberately lightweight and operate on the assumption that each one does **one thing well**:

_Input a source → Output a single image frame (as np.ndarray)_

---

## Design Principles

| Principle                  | Rationale                                                                 |
|----------------------------|--------------------------------------------------------------------------|
| Stateless classes          | Safe for background workers and multi-threading                         |
| One-way operation          | Avoids need for decoder lifecycle, memory retention, or cleanup         |
| Duck typing                | Only `decode()` is mandatory                                             |
| Declarative registration   | Plugins are registered via introspection of `decoder_name`              |
| Transparent errors         | Fail loudly and log errors — no silent failures                         |

---

## Decoder Registry

Decoders are **loaded at runtime** during app initialization via `register_decoders()`.

Each decoder must:
- Inherit `DecoderInterface`
- Provide `decoder_name` (class-level str)
- Implement `@staticmethod decode(url: str) -> np.ndarray`

The registry stores **classes**, not instances:

```python
decoders["youtube"] = YouTubeDecoder  # not YouTubeDecoder(url)
```

This lets the calling code construct instances with parameters (`url`, etc.) as needed.

---

## Decoder Types (Today)

| Type           | Description                                                | Example                      |
|----------------|------------------------------------------------------------|------------------------------|
| Direct URL     | Simple JPEG stream                                         | `BasicDecoder`               |
| API-driven     | Extracts from API or structured source                     | `APIRouteDecoder`, `YouTubeDecoder` |
| Screenshot     | Renders headless browser snapshot                          | `WebpageSnapshotBasicDecoder`      |
| Specialized    | You write it — decode frames from anything                 | Yours here!                 |

---

## Future Capabilities

| Goal                                | Notes                                                                 |
|-------------------------------------|-----------------------------------------------------------------------|
| More robust metadata interface      | Extend `get_metadata()` into declarative field descriptions           |
| Plugin versioning / capabilities    | Decoders may register features (e.g. "supports_audio": False)         |
| Headless browser pool               | Manage rendering decoders more efficiently                           |
| Capture fallback strategies         | If primary fails, try another (e.g., cached / proxy)                  |
| Shared plugin config                | Shared secrets or rate limits tracked per plugin                      |
| Plugin sandboxing (optional)        | Protect against unstable imports (Pyodide or WASM?)                  |

---

## Decoders in the App Lifecycle

```text
[ Dispatcher ] --> [ Queue Task ] --> [ Decoder.decode(url) ]
                                          |
                                          v
                                 [ np.ndarray image ]
                                          |
                                          v
                              [ Save JPG / Notify frontend ]
```

---

## Considerations for Developers

- Don't store internal state
- Use short timeouts for external resources
- Fail fast and raise informative errors
- Stubs are fine — `get_metadata()` can return default payload

---

## Final Thoughts

Decoders are like **sensors** for the system — they "see" into the outside world. We treat them as swappable and experimental. Their purpose is not to be bulletproof but to be _composable_, _traceable_, and _testable_.

> We’d rather let them fail _loudly_ than hide problems.

---




2. Updated Long-Term Vision for Feedalor Capture

Before	Now and Future
CCTV Stream Grabber only	Universal Visual Capture Engine
New Mission:

Poll anything that changes visually over time.

Collect still frames representing external evolving worlds.

Store lightweight frozen visual moments (no video capture, no heavy media).

This design lets us cover:

Traditional CCTV use.

Website monitoring.

Sensor visualization.

Weather stations.

Public displays.

Dashboards.

Data feeds visualization.

Without changing the core architecture — just plugging in new decoders!

Want to add a new decoder? See [`dev_guide_plugins.md`](dev_guide_plugins.md)