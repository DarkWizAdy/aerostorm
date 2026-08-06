import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

PHOTO_STORE = []
MAX_PHOTOS = 50

class PhotoHandler(SimpleHTTPRequestHandler):
    def _set_json_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path == '/upload':
            try:
                length = int(self.headers.get('Content-Length', 0))
                raw_body = self.rfile.read(length)
                body = json.loads(raw_body)
                image = body.get('image')
                if not isinstance(image, str) or not image.startswith('data:image/'):
                    raise ValueError('Invalid image data')
            except Exception:
                self._set_json_headers(400)
                self.wfile.write(json.dumps({'error': 'Invalid payload'}).encode('utf-8'))
                return

            PHOTO_STORE.append(image)
            if len(PHOTO_STORE) > MAX_PHOTOS:
                del PHOTO_STORE[:-MAX_PHOTOS]

            self._set_json_headers(201)
            self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
            return

        if self.path == '/clear-photos':
            try:
                PHOTO_STORE.clear()
                self._set_json_headers(200)
                response = json.dumps({'success': True}).encode('utf-8')
                self.wfile.write(response)
                self.wfile.flush()
                return
            except Exception as e:
                print(f'Error clearing photos: {e}')
                self._set_json_headers(500)
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
                self.wfile.flush()
                return

        return super().do_POST()

    def do_GET(self):
        if self.path == '/photos-list':
            self._set_json_headers(200)
            self.wfile.write(json.dumps(PHOTO_STORE).encode('utf-8'))
            return
        return super().do_GET()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '8000'))
    server_address = ('', port)
    httpd = HTTPServer(server_address, PhotoHandler)
    print(f'Serving on http://localhost:{port}')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down server...')
        httpd.server_close()
