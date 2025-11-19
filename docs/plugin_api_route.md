### `api_route.md` — Google Maps Route Decoder Plugin

#### Overview
`API_Route_Decoder` is a plugin for the Feedalor Capture system that generates a visual map of a driving route between two UK postcodes using the Google Maps Directions and Static Maps APIs.

It overlays:
- The route line
- Travel time with current traffic
- Colored warnings if thresholds are exceeded

---

### How It Works

1. **Accepts a URL-style input string** like:
   ```
   ROUTE:SP4 7DE->SE1 7PB;threshold=40
   ```
   - `SP4 7DE` is the origin  
   - `SE1 7PB` is the destination  
   - `threshold=150` (optional) marks excessive journey times

2. **Fetches the route** from the Google Directions API  
3. **Calculates duration in traffic**  
4. **Draws the route** on a Google Static Map  
5. **Caches** the image in:
   ```
   app/plugins/cached_data/api_route/map_cache/
   ```
   using a hash of the route polyline and color this is to reduce API calls, and limit most API calls to the journey time only. The hash is used so that a new map may be downloaded if the route changes.

6. **Overlays** travel time text  
7. **Increments an API usage tally** stored in:
   ```
   app/plugins/cached_data/api_route/api_tally.txt
   ```

---

### API Request Tally

A monthly counter tracks API usage to help manage quotas. Format:
```
2025-05:8
```

This file is automatically created and updated.

---

### Auto-Pruning

- Cached map images older than `30` days are automatically deleted
- Controlled via: `MAX_CACHE_AGE_DAYS = 30`

---

### Requirements

- Google Maps APIs:
  - **Directions API**
  - **Static Maps API**
- `.env.keys` file in the project root:
  ```
  GOOGLE_MAPS_API_KEY=your_key_here
  ```
- Local font at:
  ```
  app/plugins/fonts/dejavu-sans-ttf-2.37/ttf/DejaVuSans.ttf
  ```

---

### Example Use

```python
decoder = get_decoder_by_name("api_route")
img = decoder.decode("ROUTE:SP4 7DE->SE1 7PB;threshold=150")
cv2.imwrite("route_output.jpg", img)
```
