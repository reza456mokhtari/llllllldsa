# EpicWord — db/ (the archive folder)

This folder is the **database layer** of EpicWord.

## What lives here
- `db.js` — `W.DB`, a zero-dependency IndexedDB wrapper. Every successful
  **SAVE & PROCESS** writes the FULL chronicle here (title, description, html,
  plain text, dossier lines, genre/theme/quality, provider, words, pinned flag).

## Where the records physically are
Records are stored in the browser's IndexedDB database **`epicword-db`**,
object store **`chronicles`** (keyPath `id`, index `ts`). IndexedDB lives in
the browser profile's on-disk storage — think of it as the app's db folder.
This file + `db.js` are the code-side of that folder.

## Why
- localStorage quota is ~5 MB and fails silently — chronicles used to vanish
  after a few runs (cap was 6).
- IndexedDB stores hundreds of long chronicles; localStorage now keeps only
  light indexes (last 60, heavy fields trimmed on quota).
- READ lists every archived chronicle (★ pinned first), click to restore the
  full text + dossier **without regenerating**.

## API
`W.DB.put(rec) · get(id) · all() · del(id) · clear() · count()`
