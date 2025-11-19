# Route Documentation: Grid View Endpoints (`gridview.py`)

This module defines frontend-facing routes for rendering full-screen feed grid views. These are display-only, non-authenticated pages designed for operational use or visual monitoring.

---

## Route: `/standard_grid`

### Description
Displays a fullscreen grid of **all currently available feeds**, automatically scaled to fit the browser viewport.  Each tile includes a tooltip of the UUID and feed title.

### Method
`GET`

### Parameters
_None._

### Behavior
- Pulls all feeds via internal logic (JS requests `/api/feeds`)
- Dynamically scales and tiles them
- Refreshes every 10 seconds
- Only refreshes tiles where the `last_capture_at` has changed
- Tiles are repeated if the number of feeds does not fill the grid evenly

### Template Used
`standard_grid.html`

---

## Route: `/custom_grid`

### Description
Displays a fullscreen grid of **specific feeds**, based on UUIDs provided via a query string. Useful for custom or filtered views initiated from the UI.  Each tile includes a tooltip of the UUID and feed title.

### Method
`GET`

### Query Parameters

| Name   | Type   | Required | Description                            |
|--------|--------|----------|----------------------------------------|
| feeds  | string | Yes      | Comma-separated list of feed UUIDs     |

Example:
`/custom_grid?feeds=uuid1,uuid2,uuid3`


### Behavior
- Validates and filters UUIDs against the database
- Skips invalid or missing feeds silently
- Tiles are repeated as needed to fill space
- Refreshes every 10 seconds using `/api/feeds`, updating only changed images
- Uses `data-uuid` attributes for efficient DOM targeting
- Avoids flicker with fade-in transitions on update
- Will render from 1 to *n* feeds.


### Template Used
`custom_grid.html`

---

## Auth
None — these pages are read-only and assumed to be deployed in a protected environment.

---

## Related Files

| File             | Purpose                                |
|------------------|----------------------------------------|
| `gridview.py`    | Flask route handlers                   |
| `standard_grid.html` | Template for viewing all feeds     |
| `custom_grid.html`   | Template for selected feeds         |
| `FeedTable.jsx`  | Provides the selection UI              |
| `App.jsx`        | Handles the redirect to `/custom_grid` |

---

## Notes
- `/custom_grid` is currently query-string based. A POST-to-token version was considered but deferred. See backlog (Issue 33) for design.
- These views assume that `/static/stills/<uuid>.jpg` and `/api/feeds` are accurate and up-to-date.
- URL lengths accepted by browsers varies from 2048 characters to 32000 characters.  There is no check of URL length at this time. With internet explorer, this route can safely offer up to approx 52 feeds in the URL.  Users should limit this [Stack Overflow](https://stackoverflow.com/a/417184) has a good article on this. Consider using a different browser until the POST-to-token version is implemented.
  
| Browser   | Address bar | document.location or anchor tag |
|-----------|------------|---------------------------------|
| Chrome    | 32779      | >64k                            |
| Android   | 8192       | >64k                            |
| Firefox   | >300k      | >300k                           |
| Safari    | >64k       | >64k                            |
| IE11      | 2047       | 5120                            |
| Edge 16   | 2047       | 10240                           |

This is an animated GIF demonstrating ViewFeed functionality.

<img src="images/ViewFeed.gif" width="800" height="600" />
