#!/usr/bin/env python3
"""Local preview server that behaves like GitHub Pages for clean addresses.

The site links to pages without ".html" (e.g. /accounts-architecture), which
GitHub Pages resolves to accounts-architecture.html. Python's plain
`http.server` doesn't, so run this instead:

    python3 serve.py          # http://localhost:8000
    python3 serve.py 8080     # another port
"""
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit


class CleanURLHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        full = super().translate_path(path)
        # /accounts-architecture -> accounts-architecture.html, if it exists
        clean = urlsplit(path).path
        if not os.path.exists(full) and not os.path.splitext(clean)[1]:
            html = full.rstrip("/") + ".html"
            if os.path.isfile(html):
                return html
        return full


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print(f"Serving on http://localhost:{port}")
    ThreadingHTTPServer(("", port), CleanURLHandler).serve_forever()
