# Interactive Spanish Verb Conjugations

A browser-based Spanish conjugation reference and practice app built around the *501 Spanish Verbs* dataset, with an in-place editing workflow and local persistence.

## What This Project Is

This repo contains a single-page app that:

- Loads a canonical verb dataset (`501` core verbs).
- Displays simple tenses (1-7), compound tenses (8-14), imperative, and notes in a book-style layout.
- Supports in-place practice on top of the same UI (no separate practice page/theme).
- Lets you add custom verbs and grow your own practice list.
- Persists drafts/check results in browser storage.

The current production deployment is hosted from this repo via Vercel.

## Core Features

- Fast sidebar verb search and selection.
- Dynamic table column sizing across all tense blocks.
- Notes rendering with clearer structure for pattern notes, related words, synonyms, and antonyms.
- In-place editing of form cells:
- Single-click a form cell to edit.
- Double-click a form cell to open the tense help popover.
- Immediate feedback colors for entered answers:
- `#ff4500` while edited/incorrect.
- `#ff8c00` for accent/diacritic-near matches.
- Default/white for correct values.
- Custom verb creation from search when no exact match is found.
- Optional model-verb linkage for custom verbs.
- Model-based answer-key generation for custom verbs.
- Finalize flow for custom verbs (locks and queues for review, does not mutate canonical core data).
- Starter slang import set (12 verbs) for fast practice seeding.
- Local export/import backup for all practice state.

## Keyboard Shortcuts

All shortcuts are `Ctrl+Shift+<key>`:

- `K`: Check current verb.
- `V`: Reveal expected answers for current verb.
- `X`: Clear current verb forms to blanks.
- `S`: Save a draft snapshot.
- `E`: Export local backup JSON.
- `I`: Import local backup JSON.
- `L`: Import 12 slang starter custom verbs.
- `M`: Set model verb for current custom verb.
- `G`: Generate answer key from selected model verb.
- `F`: Finalize current custom verb (locks and adds to pending queue).

## Data and State Contracts

- Core dataset runtime source: `verbs-data.js` (`window.VERB_DATA`).
- Canonical JSON source: `verbs-data.json`.
- Local storage key: `ivc_state_v1`.
- Verb key schema:
- Core verbs: `core:{id}`
- Custom verbs: `custom:{id}`
- Cell key schema:
- Tense cells: `s:{tenseNum}:{sg|pl}:{rowIndex}`
- Imperative cells: `i:{yo|tu|usted|nosotros|vosotros|ustedes}`
- Check status classes map to:
- `correct`
- `accent_warning`
- `incorrect`
- `empty`

## Repository Layout

- `Interactive__Verbs.html`: Main app HTML + CSS shell.
- `interactive_verbs_app.js`: Main runtime logic (state, rendering, practice, shortcuts, custom verbs).
- `verbs-data.js`: Browser-loaded data payload.
- `verbs-data.json`: Canonical data JSON.
- `build_501_data.py`: Parser/build script that regenerates `verbs-data.json` and `verbs-data.js`.
- `Interactive__Verbs_StyleEditor.html`: Style lab/editor variant for tuning design tokens.
- `ai_format_notes.py`: AI-assisted notes normalization script for structured/readable note output.
- `docs/back-burner-plan.md`: Parked future-plan thread.
- `vercel.json`: Root rewrite to `Interactive__Verbs.html`.

## Run Locally

### 1) Serve the folder

Use a static file server from repo root:

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/Interactive__Verbs.html
```

### 2) Optional: rebuild data from source text

```powershell
python build_501_data.py
```

This updates:

- `verbs-data.json`
- `verbs-data.js`

## AI Notes Formatting Workflow (Optional)

`ai_format_notes.py` can process notes through `gpt-4o-mini` and write structured outputs.

```powershell
python ai_format_notes.py --input verbs-data.json
```

If no API key is provided via `--api-key` or `OPENAI_API_KEY`, the script prompts securely for one.

Default outputs include:

- `ai_notes_progress.jsonl`
- `ai_notes_structured.json`
- `ai_notes_display.json`
- `ai_notes_failures.json`
- `verbs-data.ai-notes.json`

## Deployment

Vercel is configured as a static deployment with `/` rewritten to `Interactive__Verbs.html`.

Typical release flow:

```powershell
git add .
git commit -m "Describe change"
git push origin main
vercel --prod --yes
```

## Design Principle

The app is intentionally tuned so new behavior extends the existing visual system instead of introducing new UI themes/patterns. Practice/edit features should remain in-place and visually consistent with the reference experience.
