# EpicWord — Word Clone · AI Chronicle Engine (GLM-5.3-Flash)

A complete, dependency-free Microsoft-Word workspace with a GLM-5.3-Flash writing engine behind the SAVE seal.

## Run it
| Mode | How |
|---|---|
| **Web (any browser)** | Double-click `epicword/index.html` (works fully offline from `file://`) |
| **Desktop (Edge app window, zero install)** | Double-click `desktop/launch-epicword.bat` |
| **Desktop (Electron, optional)** | `cd desktop/electron`, `npm install`, `npm start` |

## The workspace
- **Menubar** — File / Edit / View / Insert / Format / Tools / Window / Help — every item is wired to a real action.
- **Ribbon (HOME)** — Clipboard · Font · Paragraph · Styles · Editing (Find/Replace) groups with live active-state reflection; **AI ENGINE** ribbon tab carries WEB / THINK toggles, key/model settings and the SAVE & PROCESS seal.
- **Tab 1 — TODO**: add / complete / edit / filter / delete tasks with priority + due chips and a progress bar.
- **Tab 2 — AI WORKSPACE**:
  - **WRITE sub-tab** — the only place for drafting/editing/deleting user text; debounced auto-checkpoints (↺ RESTORE / CHECKPOINT NOW) + the physical **SAVE & PROCESS** ember seal.
  - **READ sub-tab** — output only: streamed chronicle with a pulsing ember cursor, HALT / COPY / BACK controls, recent chronicles list, and the **RESEARCH & VISIT REPORT** — strictly ≤ 24 lines, opening with the exact first six words of your draft.
- **Tab 3 — DATATABLE**: interactive grid — add/rename/delete columns & rows, inline cell editing, click-to-sort, live filter, CSV export/import.

## The engine
- **Persona**: THE HOLLOW CHRONICLER — master dark-fantasy & epic-cinematic author (Dark Souls · Sekiro · Elden Ring · Berserk · Avengers-scale cinema).
- **Provider**: any OpenAI-compatible endpoint; defaults to Zhipu bigmodel `glm-5.3-flash-free`. Paste your GLM key in **Tools → Preferences — GLM engine…**. The key lives only in local storage.
- **Grades of fire**: `WEB SWEEP` adds the `web_search` tool; `THINK` adds deep-reasoning (no-spoilers directive); both gracefully self-strip if a provider rejects them, and a network failure hands the quill to the **local ember scribe** so SAVE never dead-ends.
- **Flow**: SAVE → commit draft → instant redirect to READ → streamed delivery → dossier stamped.

## Keyboard
`Ctrl+S` save&process · `Ctrl+N/O` new/open · `Ctrl+F/H` find/replace · `Ctrl+P` print · `Ctrl+B/I/U` bold/italic/underline · `Alt+1/2/3` tabs · `Alt+W` WRITE↔READ · `Alt+Q` collapse ribbon · `Esc` halt stream.

## Data
Everything persists to `localStorage` (`epicword.v1`): document, draft checkpoints, tasks, grid, engine config, chronicles. **Tools → Wipe local data** restores factory seeds.
