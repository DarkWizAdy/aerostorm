# Aerostorm Racing Website — Project Brief

Student-led F1-in-Schools/STEM racing team site. Static HTML pages, Tailwind CSS via CDN, no build step. Originally scaffolded through a no-code AI site builder (see `/_sdk/element_sdk.js`, `/_sdk/data_sdk.js` refs and Cloudflare snippet in HTML `<head>`/footer) — the live GitHub connection lives on that platform's side, not in this local folder, so treat `git remote` as needing to be (re)established, not assumed.

## Design system (do not change unless asked — user chose "cleanup + automation, not a visual redesign")
- Colors: base `#000000`/`#0a0a0a`/`#111111`, card surface `#1e1e1e`, borders `#2c2c2c`/`#1e1e1e`, body text `#e8e8e8`, muted grays `#636363`→`#bababa`, signature accent (champagne/gold) `#e0d2b3` with secondary shade `#d0bd92`. Sponsor tiers: gold `#b8860b`/`#ffd700`, silver `#71706e`/`#c0c0c0`, bronze `#8b5a2b`/`#cd7f32`.
- Fonts (Google Fonts, loaded per-page): **Outfit** (`.font-heading`, body/headings), **Space Mono** (`.font-mono`, labels/eyebrow text), **MuseoModerno** (`.font-racing`, the stylized "racing"/"updates"/"engineering" wordmark next to the logo).
- Icons: Lucide (`lucide.createIcons()` call required after any dynamic DOM insertion).
- Logo: `aerostormLogoNoBG.png` (nav/hero, transparent), `aerostormLogoFinal.png` (og:image meta only).
- Sponsor logos: `Sponsor1Logo.png` (F1 Bearings), `awlLogo.webp` (AWL), `EFABLINK logo 2025 Light White transparent.png`, `WATTHiFi Logo.png`, `ITSS Logo.png`.

## File map
- `HomePage.html`, `Engineering.html`, `Sponsorship.html`, `Updates.html` — content pages, all share the same nav/footer markup (no shared partial/include system yet — edits to nav must be repeated per file).
- `PitWall.html` / `JoinTheGrid.html` — live camera capture + shared photo gallery feature (separate subsystem, backed by `server.py`).
- `server.py` — the **single** backend now (Python stdlib `http.server`, zero deps). `POST /upload`, `GET /photos-list`, `POST /clear-photos`. Also serves the whole site as static files (it's a `SimpleHTTPRequestHandler` subclass) — run it locally to test anything that does a `fetch()`, since `file://` pages can't fetch local JSON.
- `styles.css` / `script.js` — shared styling/behavior across all pages.
- `requirements.txt` — intentionally empty (documents server.py needs no packages).
- `updates.json` — data source for `Updates.html`'s card feed (array of `{id, date, displayDate, title, category, summary, icon, image, pdf}`), fetched and rendered client-side.
- `updates-pdfs/` — drop a PDF here to get an auto-generated Update card (tracked in git — PDFs here are meant to be linked live from the site, unlike `reference-docs/`).
- `updates-manifest.json` — tracks which PDFs in `updates-pdfs/` have already been turned into `updates.json` entries, so the automation doesn't duplicate them.
- `scripts/process-update-pdfs.md` — the prompt driving the headless Claude run; `scripts/run-pdf-check.ps1` — the script Windows Task Scheduler actually invokes daily.
- `car-renders/` — the original 6 collage/contact-sheet PNG pages extracted from the source PDFs (`render-1.png`–`render-6.png`), kept for reference only. **Not currently used on the live page** — superseded by `Images/`, see below.
- `Images/` — user-supplied car renders and photos (tracked in git). `Engineering.html` currently references `Images/Render1.png` (hero), `Images/Image1.png` (front orthographic), and two `Images/WhatsApp Image ...jpeg` files (side profile, front-quarter) by their literal filenames — don't rename these without updating the page. A few more images in this folder (`Render2.png`, more WhatsApp photos, `Aryan Sucks.png`) aren't used yet.
- Nav breakpoint: the link ribbon (About…Contact) collapses behind the hamburger below **`lg` (1024px)**, not `md` (768px) — this was a deliberate fix, don't revert to `md`. Only the link list collapses; the logo/hamburger row never does. `PitWall.html` has no link ribbon (just a logo + "Join Grid" button) so this doesn't apply there — its nav instead uses `flex-wrap` so the button drops to its own line on very narrow screens instead of overlapping the logo.

## Already done this session
1. Removed the redundant Node/Express/Socket.io backend (`server.js`, `package.json`) — `server.py` is now the only backend.
2. Renamed the badly-named sponsor logo `image-removebg-preview (15).png` → `WATTHiFi Logo.png` and fixed both references in `Sponsorship.html`.
3. **Engineering.html rewrite** — done, using the confirmed AR Ventus 2.27 / AR Nimbus 4.51 content brief (now removed from this file since it's live on the page; see git history if the source brief is ever needed again). Cropped 4 clean shots from the raw `car-renders/render-*.png` collage pages into `car-renders/nimbus-*.png` and used them across the Evolution, Aerodynamics, and Manufacturing sections.
4. **Updates.html made data-driven** — cards now render from `updates.json` via JS, same visual style and Load More behavior as before. Fixed two pre-existing broken Lucide icon names in the process (`tool` → `wrench`; this Lucide version — 0.263.0 — doesn't have `tool`, `triangle-alert`, `circle-check`, or `scan-search`; check `Object.keys(window.lucide.icons)` in-browser before using an unfamiliar icon name on this site).
5. **PDF-drop automation scaffolding built**, but not yet fully wired up:
   - `updates-pdfs/`, `updates-manifest.json`, `scripts/process-update-pdfs.md`, and `scripts/run-pdf-check.ps1` all exist and are ready.
   - User confirmed cadence: **once daily at midnight** (not "every few hours" as originally guessed).
   - **Blocked on:** the `claude` CLI isn't on this machine's PATH (checked both Git Bash and PowerShell, plus `npm` — none found), so the actual `claude -p` invocation in `run-pdf-check.ps1` can't be tested yet. Once Claude Code CLI is confirmed installed and reachable, the remaining step is registering the Windows Scheduled Task (`Register-ScheduledTask`, daily trigger at 00:00, action = `powershell.exe -ExecutionPolicy Bypass -File scripts\run-pdf-check.ps1`) — hasn't been done since that's a standing system-level change and needs the user's explicit go-ahead, not just a plan approval.
6. **README.md updated** to match current reality — Node references gone, `updates.json`/PDF automation documented, project structure tree current.
7. **Swapped Engineering.html's car images** for the higher-quality renders/photos the user dropped into `Images/` (branded "aerostorm" logo visible, no collage-page artifacts) — replaces the cropped `car-renders/nimbus-*.png` versions used before. Those cropped files were deleted; the original `car-renders/render-*.png` collage pages are kept for reference but are no longer referenced by any page.
8. **Fixed responsive layout bugs found across every page**, found by testing at mobile (375px) and tablet (768px) in-browser:
   - Nav ribbon overflow on tablet: the link list's collapse breakpoint was `md` (768px) — the same width as the tablet test itself — so links overlapped the logo. Bumped to `lg` (1024px) across `HomePage.html`, `Engineering.html`, `Sponsorship.html`, `Updates.html`, `JoinTheGrid.html`.
   - `HomePage.html` Contact section: the email address overflowed into the "Follow Us" social icons at tablet width, because an inner `sm:grid-cols-2` split into 2 columns while the *outer* section grid had already gone 2-column at `md` — squeezing the inner grid below the width an unbreakable email string needs. Changed the inner grid to `lg:grid-cols-2` and added `break-all` to the email `<span>` as a safety net.
   - `PitWall.html` nav (logo + "Join Grid" button, no hamburger — it's the only page structured this way): the button wrapped its own text and overlapped the logo at phone widths. Shrunk the button and wordmark responsively, added `flex-wrap` to the nav row as a fallback, and bumped the hero section's top padding (`pt-28 sm:pt-24`) so wrapped-nav height doesn't clip content.
   - Verified full mobile + tablet scroll-through on all 6 pages after fixes; verified desktop (1280px) nav is unaffected.

## Pending work
1. **Register the Windows Scheduled Task** for `scripts/run-pdf-check.ps1` once `claude` CLI is confirmed installed and working from a terminal on this machine. Ask the user to confirm the CLI works (`claude --version` from a fresh terminal) before registering — don't assume it's fixed itself.

## Notes / constraints
- No visual redesign — user explicitly chose cleanup + automation only, keep the black/gold identity and existing layouts as-is.
- Custom domain migration is planned for later — not in scope yet, don't touch DNS/hosting config unless asked.
- User is non-technical-ish ("new at this") — prefer clear, low-risk steps; confirm before anything destructive (deletions, force-pushes, history rewrites).
