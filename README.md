# nanohydroxyapatite-lock

A single-page trap site. Clicking **ENTER** grabs fullscreen + pointer lock, then
swallows every input event. The only way out is to type:

    nanohydroxyapatite

A progress bar fills as you type. A hint appears after 45 seconds of failure.

## Files

- `index.html` — markup
- `style.css` — dark terminal theme
- `script.js` — lock logic, input suppression, fullscreen/pointer-lock re-acquire

## Deploy on GitHub Pages

1. Create a new repo (e.g. `nanohydroxyapatite-lock`).
2. Drop the three files at the repo root.
3. Push:
