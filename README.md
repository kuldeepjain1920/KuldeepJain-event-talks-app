# BigQuery Release Notes Tracker

> A sleek, single‑page web app that fetches, parses, and displays Google Cloud BigQuery release notes.

## 🌟 Features
- **Automatic feed fetching** from the official ATOM feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`).
- **Robust XML parsing** – extracts ID, title, date, content, and link for each release.
- **REST API** – `GET /api/releases` returns a clean JSON array.
- **Premium UI** – dark theme, glass‑morphism background, smooth micro‑animations, Google Fonts, Font‑Awesome icons.
- **Live search & stats** – filter notes by keyword/date and see the total count.
- **Refresh button** – re‑fetch the latest notes on demand.
- **Share on X (Twitter)** – compose a tweet‑style preview of any note (max 280 chars).

## 🛠️ Tech Stack
- **Backend**: Python 3, Flask, `requests`, `xml.etree.ElementTree`.
- **Frontend**: HTML5, vanilla CSS, vanilla JavaScript (`static/app.js`).
- **Deployment**: Runs locally on port 5001; can be containerised or deployed to any WSGI‑compatible host.

## 📦 Prerequisites
- Python 3.9+ installed
- `pip` (or `uv`) for dependency management
- Internet connection (to fetch the feed)

## 🚀 Installation & Running Locally
```bash
# Clone the repo (if you haven’t already)
git clone https://github.com/kuldeepjain1920/KuldeepJain-event-talks-app.git
cd KuldeepJain-event-talks-app

# Optional: create a virtual environment
python -m venv venv
source venv/bin/activate   # macOS / Linux
# .\venv\Scripts\activate   # Windows

# Install dependencies
pip install Flask requests

# Start the development server
python app.py   # runs on http://localhost:5001
```
Open your browser at `http://localhost:5001` to view the app.

## 📡 API Endpoint
- **GET `/api/releases`** – returns a JSON array of release notes.
```json
[
  {
    "id": "tag:google.com,2005:BigQueryRelease/12345",
    "title": "BigQuery 2.0 – New UI",
    "date": "2024-10-01T12:00:00Z",
    "content": "We added a redesigned UI...",
    "link": "https://cloud.google.com/bigquery/docs/release-notes#2_0"
  }
]
```
On error the response contains an `error` field and HTTP 500 status.

## 🖥️ UI Overview
- **Header** – logo, title, refresh button.
- **Search bar** – type to filter notes instantly.
- **Stats counter** – shows the number of loaded releases.
- **Release cards** – title, date, short content, link, and a share button that opens the X‑composer dialog.
- **X‑Composer dialog** – edit a tweet‑style summary (280 char limit), cancel or publish.

## 🎨 Styling Highlights (`static/styles.css`)
- Dark background with a semi‑transparent glass‑morphism overlay.
- Smooth hover transitions and spinner animation.
- Responsive flexbox layout for all screen sizes.
- Custom scrollbars and `::backdrop` styling for the dialog.

## 🧪 Testing Checklist
1. Start the server and verify `GET /api/releases` returns JSON.
2. Load the UI – cards should appear, search should filter, stats should show the count.
3. Click **Refresh** – spinner rotates and list updates.
4. Open the share dialog – character counter updates, cancel and publish buttons work.

## 📦 Deployment Tips
- Set `FLASK_ENV=production` and disable debug mode.
- Use a WSGI server such as **gunicorn**:
  ```bash
  gunicorn -w 4 -b 0.0.0.0:5000 app:app
  ```
- Docker example (`Dockerfile`):
  ```Dockerfile
  FROM python:3.11-slim
  WORKDIR /app
  COPY . /app
  RUN pip install --no-cache-dir Flask requests
  EXPOSE 5000
  CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
  ```

## 📄 License
MIT – feel free to fork, adapt, and deploy.

---

*Enjoy staying up‑to‑date with BigQuery releases!*
