# Project Overview – BigQuery Release Notes Tracker

## Main Features
- **Fetches** the official BigQuery release‑notes ATOM feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`).
- **Parses** the XML into a clean JSON payload (id, title, date, content, link).
- Provides a **REST API** (`GET /api/releases`) that returns the parsed release notes.
- Renders a **single‑page web UI** that displays the notes as cards, supports:
  - Live **search** by keyword/date.
  - **Refresh** button to re‑fetch the feed.
  - **Twitter/X** composer dialog to share a note.
- Uses **modern UI design** (glass‑morphism background, dark theme, custom fonts, Font‑Awesome icons, CSS animations).

---

## Server‑Side (`app.py`)
| Section | Purpose |
|---------|---------|
| Imports | `os`, `requests`, `xml.etree.ElementTree`, Flask utilities. |
| `FEED_URL` | Constant pointing to the BigQuery release‑notes feed. |
| `parse_release_notes(xml_content)` | Parses the ATOM XML, extracts each `<entry>` (title, date, content, link, id) and returns a list of dicts. Handles XML parse errors gracefully. |
| `@app.route('/')` (`index` view) | Serves the HTML UI (`templates/index.html`). |
| `@app.route('/api/releases')` (`get_releases`) | • Calls `requests.get(FEED_URL)` with a 10‑second timeout.
| | • On success, passes the raw XML to `parse_release_notes`.
| | • Returns a JSON array of releases (`jsonify`).
| | • On any network or parsing error, returns a JSON error with HTTP 500. |
| `if __name__ == '__main__':` | Runs the Flask development server on **port 5001** with `debug=True`. |

### Key server flow
1. **Client** requests `/api/releases`.
2. Flask endpoint `get_releases` performs an HTTP GET to the Google feed.
3. The XML response is handed to `parse_release_notes` which builds a list of clean Python dicts.
4. The list is returned as JSON to the client.

---

## Client‑Side (HTML / CSS / JS)
- **`templates/index.html`** – the single‑page skeleton:
  - Loads Google Fonts (Outfit, Plus Jakarta Sans) and Font‑Awesome.
  - Links to `/static/styles.css` for the visual design (glass‑morphism, dark‑theme, animations).
  - Contains the main UI elements: header, search bar, stats counter, a `<main>` container (`#releases‑container`) for the cards, and the hidden tweet‑composer `<dialog>`.
- **`static/app.js`** (not shown but typical) – JavaScript logic:
  1. On page load, fetch `/api/releases` via `fetch`.
  2. Populate `#releases‑container` with card elements for each release (title, date, content snippet, link).
  3. Update the stats counter with the number of releases.
  4. Wire up the **Refresh** button to re‑run the fetch (show spinner while loading).
  5. Implement the **search** input to filter the displayed cards in real‑time.
  6. Open the **Twitter/X dialog** when a user clicks “share”, pre‑fill the textarea, enforce the 280‑character limit, and provide cancel/publish actions.
- **`static/styles.css`** – provides the premium visual experience:
  - Dark background with a semi‑transparent glass‑morphism overlay (`.glass-bg`).
  - Smooth hover transitions, micro‑animations for cards, spinner rotation, and dialog fade‑in.
  - Responsive layout using flexbox and media queries.

---

## Sample Request/Response Flow
```
User (browser) → GET /api/releases

Server (Flask)                         :
  1️⃣ receives request at @app.route('/api/releases')
  2️⃣ performs requests.get(FEED_URL)
  3️⃣ parses XML → list of dicts
  4️⃣ jsonify(list) → JSON response (200 OK)

Response payload (excerpt):
[
  {
    "id": "tag:google.com,2005:BigQueryRelease/12345",
    "title": "BigQuery 2.0 – New UI",
    "date": "2024-10-01T12:00:00Z",
    "content": "We added a redesigned UI...",
    "link": "https://cloud.google.com/bigquery/docs/release-notes#2_0"
  },
  ...
]

Client‑side JavaScript:
  fetch('/api/releases')
    .then(r => r.json())
    .then(data => renderCards(data))
    .catch(err => showError(err));
```
The UI then displays each entry as a card, updates the “Loading releases…” counter to the total count, and enables the user to search or share a specific note.

---

## How to View This File
Open it directly in the repository at `PROJECT_OVERVIEW.md` or run `view_file` on the path.

---

*End of overview.*
