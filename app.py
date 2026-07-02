import os
import requests
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, send_from_directory

app = Flask(__name__, static_folder='static', template_folder='templates')

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_release_notes(xml_content):
    # Atom feeds use the namespace "http://www.w3.org/2005/Atom"
    namespace = {'ns': 'http://www.w3.org/2005/Atom'}
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as e:
        return {"error": f"Failed to parse XML: {str(e)}"}

    entries = []
    for entry in root.findall('ns:entry', namespace):
        title_el = entry.find('ns:title', namespace)
        updated_el = entry.find('ns:updated', namespace)
        published_el = entry.find('ns:published', namespace)
        content_el = entry.find('ns:content', namespace)
        summary_el = entry.find('ns:summary', namespace)
        
        # Link extraction
        link_el = entry.find('ns:link', namespace)
        link = link_el.attrib.get('href', '') if link_el is not None else ''

        title = title_el.text if title_el is not None else 'No Title'
        
        date = ''
        if published_el is not None and published_el.text:
            date = published_el.text
        elif updated_el is not None and updated_el.text:
            date = updated_el.text

        content = ''
        if content_el is not None and content_el.text:
            content = content_el.text
        elif summary_el is not None and summary_el.text:
            content = summary_el.text

        # ID / Unique key
        id_el = entry.find('ns:id', namespace)
        entry_id = id_el.text if id_el is not None else ''

        entries.append({
            'id': entry_id,
            'title': title,
            'date': date,
            'content': content,
            'link': link
        })
    
    return entries

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
    except requests.RequestException as e:
        return jsonify({"error": f"Failed to fetch release notes: {str(e)}"}), 500

    releases = parse_release_notes(response.content)
    if isinstance(releases, dict) and "error" in releases:
        return jsonify(releases), 500

    return jsonify(releases)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
