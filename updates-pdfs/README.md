# updates-pdfs/

Drop a PDF here (e.g. a sponsor announcement, a design report, a competition recap) and it becomes an Update card automatically.

Once a day at midnight, a scheduled task checks this folder against `updates-manifest.json` in the project root. Any PDF not already listed there gets read, summarized (title, 2-3 sentence summary, category, date), and added as a new entry in `updates.json` — which is what [Updates.html](../Updates.html) renders. The original PDF stays here and is linked from the card's "Read Full Update" link.

Already-processed PDFs are left alone on later runs — nothing is re-summarized or duplicated. To force a PDF to be reprocessed, remove its entry from `updates-manifest.json`.

Don't rename or delete a PDF after it's been processed — its `updates.json` entry links directly to the filename.
