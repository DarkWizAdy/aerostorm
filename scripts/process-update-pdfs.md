You are running unattended (no human present) as a scheduled daily job for the Aerostorm Racing website. Do exactly the following and nothing else.

## Task

1. Read `updates-manifest.json` in the project root. It has the shape `{"processed": [{"filename": "...", "sha256": "...", "processedDate": "...", "updateId": "..."}]}`.
2. List every `.pdf` file in `updates-pdfs/`.
3. For each PDF whose filename is NOT already present in `updates-manifest.json`'s `processed` list:
   a. Read the PDF's content.
   b. Write a title (short, specific), a 2-3 sentence summary of what's new or noteworthy in it, and pick the best-fitting category. Prefer reusing an existing category already used in `updates.json` (currently: Engineering, Sponsorship, Team News, Competition) — only introduce a new category label if none of those genuinely fit.
   c. Use today's date for both `date` (ISO `YYYY-MM-DD`) and `displayDate` (format like `JUNE 01, 2026` — uppercase month, no leading zero on day).
   d. Build an `id` as a kebab-case slug of the title. If that slug already exists in `updates.json`, append `-2`, `-3`, etc. until unique.
   e. Append a new entry to the JSON array in `updates.json`, matching this exact shape:
      ```json
      {
        "id": "kebab-case-slug",
        "date": "YYYY-MM-DD",
        "displayDate": "MONTH DD, YYYY",
        "title": "...",
        "category": "...",
        "summary": "...",
        "icon": null,
        "image": null,
        "pdf": "updates-pdfs/<exact filename>"
      }
      ```
      Do not touch or reorder any existing entries in `updates.json` — only append. `updates.json` must remain valid JSON.
   f. Compute the SHA-256 hash of the PDF file, and append a matching entry to `updates-manifest.json`'s `processed` array: `{"filename": "<exact filename>", "sha256": "<hash>", "processedDate": "YYYY-MM-DD", "updateId": "<the id you just created>"}`. `updates-manifest.json` must remain valid JSON.
4. If a PDF's filename IS already in the manifest, skip it entirely — do not re-read it or touch its existing entry.
5. Never rename, move, edit, or delete anything inside `updates-pdfs/`.
6. Never edit any file other than `updates.json` and `updates-manifest.json`.
7. If there are no new PDFs to process, do nothing and exit quietly — do not modify either JSON file.

## Constraints

- Base every summary strictly on what's actually in that PDF. Don't invent facts, numbers, or claims that aren't in the source document.
- Keep the summary to 2-3 sentences — this renders as a short card blurb on the live site, not a full article.
- This is the only task for this run. Do not touch `Engineering.html`, `Updates.html`, `index.html`, `Sponsorship.html`, `styles.css`, `script.js`, or anything else.
