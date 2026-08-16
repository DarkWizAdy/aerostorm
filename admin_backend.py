"""
Admin portal backend: SQLite-backed auth, sessions, audit log, and
allow-listed content file read/write. Imported by server.py.

Run this file directly with --create-admin to set (or reset) the single
admin account:

    python admin_backend.py --create-admin

(server.py also forwards --create-admin to this module, so
`python server.py --create-admin` works the same way.)
"""

import argparse
import base64
import getpass
import hashlib
import json
import os
import re
import secrets
import sqlite3
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "admin.db"

SESSION_COOKIE_NAME = "admin_session"
SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60  # 7 days

# scrypt cost parameters (OWASP-recommended minimum-strength config).
# Stored per-row so they can be raised later without a schema migration.
SCRYPT_N = 16384
SCRYPT_R = 8
SCRYPT_P = 1
SCRYPT_DKLEN = 64

# name -> on-disk filename, relative to BASE_DIR. The admin API only ever
# writes files chosen from this fixed map, so a filename is never built
# from user input and path traversal is structurally impossible.
ALLOWED_CONTENT = {
    "site-config": "site-config.json",
    "nav": "nav.json",
    "updates": "updates.json",
    "sponsors": "sponsors.json",
    "gallery": "gallery.json",
    "homepage-content": "homepage-content.json",
    "pages-content": "pages-content.json",
}

# Image uploads (Gallery admin tab): allowed extensions and a size cap.
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_IMAGE_BYTES = 8 * 1024 * 1024  # 8MB
GALLERY_DIR = BASE_DIR / "Images" / "gallery"

# Pit Wall / Join the Grid camera captures. Same size cap as gallery uploads;
# always saved as .jpg since the browser always captures via
# canvas.toDataURL('image/jpeg', ...). Kept out of git (see .gitignore) since
# these are live photos of event attendees, cleared between events.
WALL_DIR = BASE_DIR / "Images" / "wall"


def _now_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_connection()
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS admin_users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                email         TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                password_salt TEXT NOT NULL,
                password_algo TEXT NOT NULL DEFAULT 'scrypt',
                password_n    INTEGER NOT NULL DEFAULT 16384,
                password_r    INTEGER NOT NULL DEFAULT 8,
                password_p    INTEGER NOT NULL DEFAULT 1,
                created_at    TEXT NOT NULL,
                updated_at    TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token_hash    TEXT PRIMARY KEY,
                user_id       INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
                created_at    TEXT NOT NULL,
                expires_at    TEXT NOT NULL,
                last_seen_at  TEXT NOT NULL,
                user_agent    TEXT
            );

            CREATE TABLE IF NOT EXISTS audit_log (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp  TEXT NOT NULL,
                user_email TEXT,
                action     TEXT NOT NULL,
                target     TEXT,
                details    TEXT
            );

            CREATE TABLE IF NOT EXISTS contact_submissions (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp  TEXT NOT NULL,
                name       TEXT,
                email      TEXT,
                message    TEXT,
                status     TEXT NOT NULL DEFAULT 'new'
            );

            CREATE TABLE IF NOT EXISTS wall_photos (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp  TEXT NOT NULL,
                image_path TEXT NOT NULL
            );
            """
        )
        conn.commit()
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

def _hash_password(password, salt=None):
    if salt is None:
        salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=SCRYPT_N,
        r=SCRYPT_R,
        p=SCRYPT_P,
        dklen=SCRYPT_DKLEN,
    )
    return salt.hex(), digest.hex()


def _verify_password(password, salt_hex, hash_hex, n, r, p):
    salt = bytes.fromhex(salt_hex)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=n,
        r=r,
        p=p,
        dklen=len(bytes.fromhex(hash_hex)),
    )
    return secrets.compare_digest(digest.hex(), hash_hex)


def create_or_update_admin(email, password):
    """Upserts the single admin account. Also serves as the 'reset my
    password' path — running it again just overwrites the one row."""
    salt_hex, hash_hex = _hash_password(password)
    now = _now_iso()
    conn = get_connection()
    try:
        existing = conn.execute("SELECT id FROM admin_users LIMIT 1").fetchone()
        if existing is None:
            conn.execute(
                """INSERT INTO admin_users
                   (email, password_hash, password_salt, password_algo,
                    password_n, password_r, password_p, created_at, updated_at)
                   VALUES (?, ?, ?, 'scrypt', ?, ?, ?, ?, ?)""",
                (email, hash_hex, salt_hex, SCRYPT_N, SCRYPT_R, SCRYPT_P, now, now),
            )
        else:
            conn.execute(
                """UPDATE admin_users
                   SET email = ?, password_hash = ?, password_salt = ?,
                       password_algo = 'scrypt', password_n = ?, password_r = ?,
                       password_p = ?, updated_at = ?
                   WHERE id = ?""",
                (email, hash_hex, salt_hex, SCRYPT_N, SCRYPT_R, SCRYPT_P, now, existing["id"]),
            )
        conn.commit()
    finally:
        conn.close()


def authenticate_user(email, password):
    """Returns the user's email on success, or None on failure."""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM admin_users WHERE email = ?", (email,)
        ).fetchone()
        if row is None:
            return None
        ok = _verify_password(
            password,
            row["password_salt"],
            row["password_hash"],
            row["password_n"],
            row["password_r"],
            row["password_p"],
        )
        return row["email"] if ok else None
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------

def _token_hash(raw_token):
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def create_session(email, user_agent=None):
    conn = get_connection()
    try:
        user = conn.execute(
            "SELECT id FROM admin_users WHERE email = ?", (email,)
        ).fetchone()
        if user is None:
            return None
        raw_token = secrets.token_urlsafe(32)
        now = time.time()
        conn.execute(
            """INSERT INTO sessions
               (token_hash, user_id, created_at, expires_at, last_seen_at, user_agent)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                _token_hash(raw_token),
                user["id"],
                _now_iso(),
                time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now + SESSION_MAX_AGE_SECONDS)),
                _now_iso(),
                user_agent,
            ),
        )
        conn.commit()
        return raw_token
    finally:
        conn.close()


def validate_session(raw_token):
    """Returns the session's user email if valid and unexpired, else None."""
    if not raw_token:
        return None
    conn = get_connection()
    try:
        row = conn.execute(
            """SELECT sessions.expires_at, admin_users.email
               FROM sessions JOIN admin_users ON admin_users.id = sessions.user_id
               WHERE sessions.token_hash = ?""",
            (_token_hash(raw_token),),
        ).fetchone()
        if row is None:
            return None
        if row["expires_at"] < _now_iso():
            conn.execute("DELETE FROM sessions WHERE token_hash = ?", (_token_hash(raw_token),))
            conn.commit()
            return None
        conn.execute(
            "UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?",
            (_now_iso(), _token_hash(raw_token)),
        )
        conn.commit()
        return row["email"]
    finally:
        conn.close()


def destroy_session(raw_token):
    if not raw_token:
        return
    conn = get_connection()
    try:
        conn.execute("DELETE FROM sessions WHERE token_hash = ?", (_token_hash(raw_token),))
        conn.commit()
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------

def log_action(user_email, action, target=None, details=None):
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO audit_log (timestamp, user_email, action, target, details) VALUES (?, ?, ?, ?, ?)",
            (_now_iso(), user_email, action, target, json.dumps(details) if details is not None else None),
        )
        conn.commit()
    finally:
        conn.close()


def get_audit_log(limit=50):
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT timestamp, user_email, action, target, details FROM audit_log ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Content read/write (allow-listed)
# ---------------------------------------------------------------------------

def write_content_file(name, data):
    """Atomically writes one of the allow-listed JSON content files.
    Returns True on success, False if `name` isn't an allowed content key."""
    filename = ALLOWED_CONTENT.get(name)
    if filename is None:
        return False
    target_path = BASE_DIR / filename
    tmp_path = target_path.with_suffix(target_path.suffix + ".tmp")
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp_path, target_path)
    return True


# ---------------------------------------------------------------------------
# Image upload (Gallery admin tab)
# ---------------------------------------------------------------------------

def save_uploaded_image(filename, data_url):
    """Validates and saves a base64 data-URL image upload into Images/gallery/.
    Returns (True, relative_path) on success, or (False, error_message)."""
    original_name = os.path.basename(filename or "")
    ext = Path(original_name).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        return False, "Unsupported file type: " + (ext or "(none)")

    if not isinstance(data_url, str) or "," not in data_url:
        return False, "Invalid image data"
    header, _, b64data = data_url.partition(",")
    if not header.startswith("data:image/"):
        return False, "Invalid image data"

    try:
        raw_bytes = base64.b64decode(b64data, validate=True)
    except Exception:
        return False, "Invalid base64 image data"

    if len(raw_bytes) == 0:
        return False, "Empty image data"
    if len(raw_bytes) > MAX_IMAGE_BYTES:
        return False, "Image too large (max " + str(MAX_IMAGE_BYTES // (1024 * 1024)) + "MB)"

    GALLERY_DIR.mkdir(parents=True, exist_ok=True)

    stem = Path(original_name).stem
    safe_stem = re.sub(r"[^A-Za-z0-9_-]+", "-", stem).strip("-") or "image"
    candidate = GALLERY_DIR / (safe_stem + ext)
    counter = 1
    while candidate.exists():
        candidate = GALLERY_DIR / (safe_stem + "-" + str(counter) + ext)
        counter += 1

    with open(candidate, "wb") as f:
        f.write(raw_bytes)

    relative_path = candidate.relative_to(BASE_DIR).as_posix()
    return True, relative_path


# ---------------------------------------------------------------------------
# Contact form submissions (replaces Formspree — stored locally)
# ---------------------------------------------------------------------------

def insert_contact_submission(name, email, message):
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO contact_submissions (timestamp, name, email, message, status) VALUES (?, ?, ?, ?, 'new')",
            (_now_iso(), name, email, message),
        )
        conn.commit()
    finally:
        conn.close()


def list_contact_submissions(limit=200):
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT id, timestamp, name, email, message, status FROM contact_submissions ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def update_submission_status(submission_id, status):
    if status not in ("new", "actioned"):
        return False
    conn = get_connection()
    try:
        cur = conn.execute(
            "UPDATE contact_submissions SET status = ? WHERE id = ?",
            (status, submission_id),
        )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def delete_submission(submission_id):
    conn = get_connection()
    try:
        cur = conn.execute("DELETE FROM contact_submissions WHERE id = ?", (submission_id,))
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Pit Wall / Join the Grid photos (replaces localStorage — synced across
# devices via SQLite + Images/wall/ instead of being per-browser only)
# ---------------------------------------------------------------------------

def save_wall_photo(data_url):
    """Validates and saves a base64 JPEG data-URL capture into Images/wall/,
    and records it in wall_photos. Returns (True, relative_path) on success,
    or (False, error_message)."""
    if not isinstance(data_url, str) or "," not in data_url:
        return False, "Invalid image data"
    header, _, b64data = data_url.partition(",")
    if not header.startswith("data:image/"):
        return False, "Invalid image data"

    try:
        raw_bytes = base64.b64decode(b64data, validate=True)
    except Exception:
        return False, "Invalid base64 image data"

    if len(raw_bytes) == 0:
        return False, "Empty image data"
    if len(raw_bytes) > MAX_IMAGE_BYTES:
        return False, "Image too large (max " + str(MAX_IMAGE_BYTES // (1024 * 1024)) + "MB)"

    WALL_DIR.mkdir(parents=True, exist_ok=True)
    target = WALL_DIR / (secrets.token_hex(8) + ".jpg")
    with open(target, "wb") as f:
        f.write(raw_bytes)
    relative_path = target.relative_to(BASE_DIR).as_posix()

    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO wall_photos (timestamp, image_path) VALUES (?, ?)",
            (_now_iso(), relative_path),
        )
        conn.commit()
    finally:
        conn.close()

    return True, relative_path


def list_wall_photos():
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT id, timestamp, image_path FROM wall_photos ORDER BY id ASC"
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def clear_wall_photos():
    """Deletes every wall photo file and DB row."""
    conn = get_connection()
    try:
        rows = conn.execute("SELECT image_path FROM wall_photos").fetchall()
        conn.execute("DELETE FROM wall_photos")
        conn.commit()
    finally:
        conn.close()

    for row in rows:
        try:
            (BASE_DIR / row["image_path"]).unlink()
        except OSError:
            pass


# ---------------------------------------------------------------------------
# CLI bootstrap: python admin_backend.py --create-admin
# ---------------------------------------------------------------------------

def _run_create_admin_cli():
    init_db()
    print("Set up (or reset) the Aerostorm admin account.")
    email = input("Admin email: ").strip()
    while not email:
        email = input("Admin email (required): ").strip()
    password = getpass.getpass("Admin password: ")
    while len(password) < 8:
        password = getpass.getpass("Admin password (min 8 characters): ")
    confirm = getpass.getpass("Confirm password: ")
    if password != confirm:
        print("Passwords didn't match. Nothing was changed.")
        return
    create_or_update_admin(email, password)
    print(f"Admin account set for {email}. You can now log in at /admin.html.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--create-admin", action="store_true")
    args = parser.parse_args()
    if args.create_admin:
        _run_create_admin_cli()
    else:
        parser.print_help()
