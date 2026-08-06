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
- `server.py` — the **single** backend now (Python stdlib `http.server`, zero deps). `POST /upload`, `GET /photos-list`, `POST /clear-photos`. Max 50 photos, in-memory only (lost on restart).
- `styles.css` / `script.js` — shared styling/behavior across all pages.
- `requirements.txt` — intentionally empty (documents server.py needs no packages).

## Already done this session
1. Removed the redundant Node/Express/Socket.io backend (`server.js`, `package.json`) — `server.py` is now the only backend. README still needs updating to drop references to the Node path (pending, see below).
2. Renamed the badly-named sponsor logo `image-removebg-preview (15).png` → `WATTHiFi Logo.png` and fixed both references in `Sponsorship.html`.

## Pending work (user-approved plan, not started)
1. **Make Updates.html data-driven.** Currently the update cards in `Updates.html` are hand-written HTML. Refactor to render from an `updates.json` file (array of `{id, date, displayDate, title, category, summary, icon, image, pdf}`) via JS, keeping the exact current visual style (card layout, "Load More" toggle behavior, category pill, Lucide icon per card). This is a prerequisite for the automation below.
2. **PDF-drop automation.** User wants: drop a PDF into a watched local folder → within a few hours, an Update card is auto-generated (AI-written 2–3 sentence summary + title + date + category, linking to the original PDF) and appended to `updates.json`, without manual editing.
   - Design: an `updates-pdfs/` folder (to be created) holds source PDFs; a `updates-manifest.json` tracks which PDFs have already been processed (by filename/hash) so re-runs don't duplicate entries.
   - **Automation mechanism differs from Cowork.** In Cowork this was going to use the built-in scheduled-tasks feature (no direct equivalent in Claude Code). In Claude Code, the standard approach is: a short script (or a `claude -p "<prompt>"` headless invocation) that scans `updates-pdfs/` against the manifest, reads any new PDF, writes the summary + updates.json entry, and updates the manifest — triggered on a recurring basis via **Windows Task Scheduler** (since there's no long-running background process otherwise). Set this up once Claude Code is installed; don't reinvent the polling logic from scratch, ask the user for their preferred check frequency if not already known (they previously said "every few hours").
3. **Engineering.html content rewrite.** Current body is a generic 3-step placeholder ("Design on Autodesk Fusion" / "Manufacturing" / "On the Track") with no real specs, photos, renders, or achievements. User wants this fully rewritten with real content — **needs source material from the user first** (car specs, CAD renders/photos, competition results, materials used, etc.). Do not fabricate technical claims.
4. **README.md update.** Currently documents both `server.py` and the Node/`package.json` path (now removed), and doesn't mention `updates.json` or the automation. Needs a pass to match current reality.

## Notes / constraints
- No visual redesign — user explicitly chose cleanup + automation only, keep the black/gold identity and existing layouts as-is.
- Custom domain migration is planned for later — not in scope yet, don't touch DNS/hosting config unless asked.
- User is non-technical-ish ("new at this") — prefer clear, low-risk steps; confirm before anything destructive (deletions, force-pushes, history rewrites).
