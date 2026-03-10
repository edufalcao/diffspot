# diffspot

A developer-focused online text diff comparison tool. Paste two texts, compare them, and export the results.

Built with a dark terminal-chic aesthetic inspired by [edufalcao.com](https://edufalcao.com).

🔗 **Live:** [diffspot.edufalcao.com](https://diffspot.edufalcao.com)

## Features

- Side-by-side or unified diff views
- Line, word, and character-level precision
- Ignore whitespace and case options
- Syntax-highlighted code editors (18+ languages)
- Drag-and-drop file upload
- Diff minimap sidebar with click/drag navigation
- Fullscreen mode for diff results
- Jump navigation between change groups (prev/next)
- Virtual scrolling for large files (handles 10k+ lines efficiently)
- Web Worker-based diff computation (non-blocking UI)
- Print / Save as PDF via browser print dialog
- Dark/light theme toggle
- Keyboard shortcuts (Ctrl+Enter to diff, Alt+Up/Down to jump, Escape to exit fullscreen)
- Cloudflare Workers backend with D1 database

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt 4 (Vue 3 + TypeScript) |
| Styling | Tailwind CSS 4 |
| Diff engine | jsdiff (`diff`) |
| Code editors | CodeMirror 6 via `vue-codemirror` |
| Print / Export | Browser print dialog (`window.print()`) |
| Icons | Lucide Vue Next |
| Fonts | Space Grotesk, DM Sans, JetBrains Mono |
| Runtime | Cloudflare Workers (via `cloudflare-pages` preset) |
| Database | Cloudflare D1 (SQLite) |

## Getting Started

```bash
npm install
npm run dev
npm run preview   # preview production build
```

## Build & Deploy

```bash
npm run build
```

Output is in `dist/` — deployed automatically to Cloudflare Pages via GitHub Actions on push to `main`.

## Database Migrations

```bash
# Run against remote D1
npx wrangler d1 execute diffspot --file=./migrations/<file>.sql --remote

# Run locally
npx wrangler d1 execute diffspot --file=./migrations/<file>.sql --local
```

## Project Structure

```
app/
├── components/
│   ├── layout/     # AppHeader, AppFooter, ThemeToggle
│   ├── editor/     # DiffEditor, EditorPair
│   ├── diff/       # DiffView, DiffSplitView, DiffUnifiedView, DiffControls, DiffStats, DiffMinimap
│   └── ui/         # GlowButton, ToggleGroup, DropdownMenu, GradientText
├── composables/    # useDiff, useEditorState, useDiffOptions, useExport, useDiffNavigation, useFullscreen, useMinimap, useVirtualScroll
├── utils/          # Pure functions (diffCompute — extracted for Web Worker)
├── workers/        # Web Workers (diff.worker — off-main-thread diff computation)
├── pages/          # index.vue
├── types/          # TypeScript interfaces
└── assets/css/     # Design system (CSS variables, animations)
migrations/         # D1 SQL migration files
server/
└── routes/         # Cloudflare Workers server routes
docs/               # PRD
public/             # Static assets (favicon, og.png)
wrangler.toml       # Cloudflare Workers + D1 binding config
```
