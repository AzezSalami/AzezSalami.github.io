# Tools

A collection of small browser tools and games, hosted on GitHub Pages. No build
step, no framework — plain HTML, one stylesheet and plain scripts.

## Run locally

Open any `.html` file directly in a browser — no server needed.

## Structure

```
<tool>.html           One page per tool — markup only (index.html is Snake)
css/styles.css        Design tokens (light/dark), layout shell, components
js/theme.js           Applies the saved theme before first paint
js/app.js             Tool registry + injected top bar / searchable sidebar / theme toggle
js/lib/               Shared helpers (DOM, clipboard, drop zone, tabs, text stats)
js/tools/<tool>.js    Logic for each tool
```

## Add a tool

1. Copy an existing page (e.g. `word-counter.html`) and change the content inside `<main>` and the last `<script>` tag.
2. Create `js/tools/<name>.js`, and pull helpers from the global `UI` (see `js/lib/ui.js`).
3. Add one entry to the `TOOLS` array in `js/app.js` — the sidebar and its search pick it up automatically.
