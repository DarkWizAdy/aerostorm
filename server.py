import json
import sys
from http import cookies
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlsplit, parse_qs

import admin_backend

SESSION_COOKIE_NAME = admin_backend.SESSION_COOKIE_NAME
SESSION_MAX_AGE_SECONDS = admin_backend.SESSION_MAX_AGE_SECONDS


class AerostormHandler(SimpleHTTPRequestHandler):
    # -- helpers ------------------------------------------------------

    def _send_json(self, status, obj, set_cookie=None, clear_cookie=False):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        if set_cookie:
            self.send_header(
                'Set-Cookie',
                f'{SESSION_COOKIE_NAME}={set_cookie}; HttpOnly; SameSite=Strict; '
                f'Path=/; Max-Age={SESSION_MAX_AGE_SECONDS}',
            )
        if clear_cookie:
            self.send_header(
                'Set-Cookie',
                f'{SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0',
            )
        self.end_headers()
        self.wfile.write(json.dumps(obj).encode('utf-8'))

    def _read_json_body(self):
        length = int(self.headers.get('Content-Length', 0))
        raw_body = self.rfile.read(length) if length else b''
        return json.loads(raw_body) if raw_body else {}

    def _session_token(self):
        header = self.headers.get('Cookie')
        if not header:
            return None
        jar = cookies.SimpleCookie()
        jar.load(header)
        morsel = jar.get(SESSION_COOKIE_NAME)
        return morsel.value if morsel else None

    def _current_admin_email(self):
        return admin_backend.validate_session(self._session_token())

    def _require_auth(self):
        """Returns the logged-in admin's email, or sends a 401 and returns None."""
        email = self._current_admin_email()
        if email is None:
            self._send_json(401, {'error': 'Not authenticated'})
            return None
        return email

    # -- routing --------------------------------------------------------

    def do_GET(self):
        path = urlsplit(self.path).path

        if path == '/api/admin/session':
            email = self._current_admin_email()
            if email:
                self._send_json(200, {'authenticated': True, 'email': email})
            else:
                self._send_json(200, {'authenticated': False})
            return

        if path == '/api/admin/audit-log':
            email = self._require_auth()
            if email is None:
                return
            query = parse_qs(urlsplit(self.path).query)
            limit = int(query.get('limit', ['50'])[0])
            self._send_json(200, {'entries': admin_backend.get_audit_log(limit)})
            return

        if path == '/api/admin/contact-submissions':
            email = self._require_auth()
            if email is None:
                return
            self._send_json(200, {'entries': admin_backend.list_contact_submissions()})
            return

        # Public route — Pit Wall polls this to display new Join the Grid
        # captures across any device on the network, not just the one that
        # took the photo.
        if path == '/api/wall-photos':
            self._send_json(200, {'photos': admin_backend.list_wall_photos()})
            return

        return super().do_GET()

    def do_POST(self):
        path = urlsplit(self.path).path

        if path == '/api/admin/login':
            try:
                body = self._read_json_body()
                email = (body.get('email') or '').strip()
                password = body.get('password') or ''
            except Exception:
                self._send_json(400, {'error': 'Invalid payload'})
                return

            authenticated_email = admin_backend.authenticate_user(email, password)
            if authenticated_email is None:
                admin_backend.log_action(email or None, 'login_failed')
                self._send_json(401, {'error': 'Invalid email or password'})
                return

            token = admin_backend.create_session(authenticated_email, self.headers.get('User-Agent'))
            admin_backend.log_action(authenticated_email, 'login')
            self._send_json(200, {'authenticated': True, 'email': authenticated_email}, set_cookie=token)
            return

        if path == '/api/admin/logout':
            email = self._current_admin_email()
            admin_backend.destroy_session(self._session_token())
            if email:
                admin_backend.log_action(email, 'logout')
            self._send_json(200, {'ok': True}, clear_cookie=True)
            return

        if path == '/api/admin/upload-image':
            email = self._require_auth()
            if email is None:
                return
            try:
                body = self._read_json_body()
                filename = body.get('filename') or ''
                data_url = body.get('data') or ''
            except Exception:
                self._send_json(400, {'error': 'Invalid payload'})
                return

            ok, result = admin_backend.save_uploaded_image(filename, data_url)
            if not ok:
                self._send_json(400, {'error': result})
                return

            admin_backend.log_action(email, 'upload_image', target=result)
            self._send_json(200, {'ok': True, 'path': result})
            return

        # Public route — no auth. This is the only unauthenticated write
        # route in the app; fine for a local-only tool, but if this site is
        # ever deployed with a public backend, add rate limiting here.
        if path == '/api/contact-submit':
            try:
                body = self._read_json_body()
                name = str(body.get('name') or '').strip()[:200]
                email_addr = str(body.get('email') or '').strip()[:200]
                message = str(body.get('message') or '').strip()[:5000]
            except Exception:
                self._send_json(400, {'error': 'Invalid payload'})
                return

            if not name or not email_addr or not message:
                self._send_json(400, {'error': 'Name, email, and message are required'})
                return

            admin_backend.insert_contact_submission(name, email_addr, message)
            self._send_json(201, {'ok': True})
            return

        # Public routes — no auth. The Join the Grid kiosk page has no login
        # of its own (matches the previous localStorage-based behavior, same
        # physical-access trust model as the event display it runs on).
        if path == '/api/wall-photos':
            try:
                body = self._read_json_body()
                data_url = body.get('image') or ''
            except Exception:
                self._send_json(400, {'error': 'Invalid payload'})
                return

            ok, result = admin_backend.save_wall_photo(data_url)
            if not ok:
                self._send_json(400, {'error': result})
                return

            self._send_json(201, {'ok': True, 'path': result})
            return

        if path == '/api/wall-photos/clear':
            admin_backend.clear_wall_photos()
            self._send_json(200, {'ok': True})
            return

        self._send_json(404, {'error': 'Not found'})

    def do_PUT(self):
        path = urlsplit(self.path).path

        if path.startswith('/api/admin/content/'):
            email = self._require_auth()
            if email is None:
                return
            name = path.rsplit('/', 1)[-1]
            try:
                data = self._read_json_body()
            except Exception:
                self._send_json(400, {'error': 'Invalid JSON body'})
                return

            ok = admin_backend.write_content_file(name, data)
            if not ok:
                self._send_json(404, {'error': f'Unknown content name: {name}'})
                return

            admin_backend.log_action(email, 'update_content', target=name)
            self._send_json(200, {'ok': True})
            return

        if path.startswith('/api/admin/contact-submissions/'):
            email = self._require_auth()
            if email is None:
                return
            submission_id = path.rsplit('/', 1)[-1]
            try:
                body = self._read_json_body()
                status = body.get('status')
            except Exception:
                self._send_json(400, {'error': 'Invalid JSON body'})
                return

            if not submission_id.isdigit():
                self._send_json(400, {'error': 'Invalid submission id'})
                return

            ok = admin_backend.update_submission_status(int(submission_id), status)
            if not ok:
                self._send_json(404, {'error': 'Submission not found or invalid status'})
                return

            admin_backend.log_action(email, 'update_submission_status', target=submission_id, details={'status': status})
            self._send_json(200, {'ok': True})
            return

        self._send_json(404, {'error': 'Not found'})

    def do_DELETE(self):
        path = urlsplit(self.path).path

        if path.startswith('/api/admin/contact-submissions/'):
            email = self._require_auth()
            if email is None:
                return
            submission_id = path.rsplit('/', 1)[-1]
            if not submission_id.isdigit():
                self._send_json(400, {'error': 'Invalid submission id'})
                return

            ok = admin_backend.delete_submission(int(submission_id))
            if not ok:
                self._send_json(404, {'error': 'Submission not found'})
                return

            admin_backend.log_action(email, 'delete_submission', target=submission_id)
            self._send_json(200, {'ok': True})
            return

        self._send_json(404, {'error': 'Not found'})


if __name__ == '__main__':
    if '--create-admin' in sys.argv:
        admin_backend._run_create_admin_cli()
        sys.exit(0)

    admin_backend.init_db()

    import os
    port = int(os.environ.get('PORT', '8000'))
    server_address = ('', port)
    httpd = HTTPServer(server_address, AerostormHandler)
    print(f'Serving on http://localhost:{port}')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down server...')
        httpd.server_close()
