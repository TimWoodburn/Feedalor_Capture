# Plugin: `api_iss`

The `api_iss` decoder plugin captures the live position of the International Space Station (ISS) overlaid on a static map fetched from the Google Maps Static API.

It uses a custom human-friendly URL parameter syntax to configure map style, zoom, label rendering, font, and image dimensions.

---

## Decoder Name

```
api_iss
```

---

## Sample Feed URL

```
ISS:map_style="hybrid", zoom=3, show_latlon=true, image_size=[1024,512], font_size=20, font_color="blue"
```

At minimum, use:
```
ISS
```

---

## Accepted Parameters

| Key            | Type      | Default       | Description                                         |
|----------------|-----------|----------------|-----------------------------------------------------|
| `map_style`    | string    | `roadmap`      | One of `roadmap`, `satellite`, `hybrid`, `terrain` |
| `zoom`         | integer   | `2`            | Zoom level for map (0–21+)                          |
| `show_latlon`  | boolean   | `true`         | Whether to draw the lat/lon text overlay            |
| `image_size`   | list      | `[800, 400]`   | Output image dimensions as `[width, height]`        |
| `font_size`    | integer   | `16`           | Font size for coordinate label                      |
| `font_color`   | string    | `red`          | Font color name (e.g., `blue`, `#ff0000`, etc.)     |

---

## External Dependencies

- **ISS location API**: http://api.open-notify.org/iss-now.json  
- **Google Maps Static API**: Requires `GOOGLE_MAPS_API_KEY` in `.env.keys`

---

## Behavior

- Draws a red marker at the ISS’s real-time location  
- Map is centered on the ISS  
- Coordinates printed in top-left if `show_latlon` is true  
- Projection handled via Web Mercator to support future flexibility  

---

## Fonts

Uses DejaVu Sans:
```
fonts/dejavu-sans-ttf-2.37/ttf/DejaVuSans.ttf
```
This is bundled locally in the plugin folder.

---

## Integration

- `ISSDecoder` implements `DecoderInterface`  
- Auto-registered by the plugin system  
- Returns a NumPy RGB array suitable for still capture and archiving

---

## Example Use Case

- Monitoring current ISS position every 5 minutes  
- Configurable for dark/light map styles  
- Useful for educational dashboards or public displays

---

## Future Enhancements

- Draw ISS trail from historical positions  
- Optional custom map center (for split-screen monitoring)  
- Overlay additional markers for other satellites or ground stations
