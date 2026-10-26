"""Testy – lokalny podgląd strony (ta sama strona działa w sieci na GitHub Pages).

Uruchomienie:  python app.py   (albo dwuklik na uruchom.bat)
Strona otworzy się sama pod adresem http://localhost:8770
Pytania leżą w dane/<zakładka>.json, a lista zakładek w dane/zakladki.json.
"""
import os
import sys
import threading
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8770
KATALOG = os.path.dirname(os.path.abspath(__file__))


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=KATALOG, **kwargs)

    def end_headers(self):
        # bez cache, żeby po dopisaniu pytań wystarczyło odświeżyć stronę
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    serwer = HTTPServer(("127.0.0.1", PORT), Handler)
    adres = f"http://localhost:{PORT}"
    print(f"Test działa: {adres}  (zamknij to okno, żeby wyłączyć)")
    if "--no-browser" not in sys.argv:
        threading.Timer(0.5, lambda: webbrowser.open(adres)).start()
    try:
        serwer.serve_forever()
    except KeyboardInterrupt:
        pass
