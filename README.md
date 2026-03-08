# diffspot

A developer-focused online text diff comparison tool. Paste two texts, compare them, and export the results — all client-side, no server required.

Built with a dark terminal-chic aesthetic inspired by [edufalcao.com](https://edufalcao.com).

## Features

- Side-by-side or unified diff views
- Line, word, and character-level precision
- Ignore whitespace and case options
- Syntax-highlighted code editors (18+ languages)
- Drag-and-drop file upload
- Export as PNG or PDF
- Dark/light theme toggle
- Keyboard shortcuts (Ctrl+Enter to diff)
- Fully static — deploy anywhere

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt 4 (Vue 3 + TypeScript) |
| Styling | Tailwind CSS 4 |
| Diff engine | jsdiff (`diff`) |
| Code editors | CodeMirror 6 via `vue-codemirror` |
| Export | `html-to-image` + `jsPDF` |
| Icons | Lucide Vue Next |
| Fonts | Space Grotesk, DM Sans, JetBrains Mono |

## Getting Started

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npx nuxt generate
```

The static output is in `.output/public/` — deploy to any static host (Vercel, Netlify, GitHub Pages, S3, etc.).

## Project Structure

```
app/
├── components/
│   ├── layout/     # AppHeader, AppFooter, ThemeToggle
│   ├── editor/     # DiffEditor, EditorPair
│   ├── diff/       # DiffView, DiffSplitView, DiffUnifiedView, DiffControls, DiffStats
│   └── ui/         # GlowButton, ToggleGroup, DropdownMenu, GradientText
├── composables/    # useDiff, useEditorState, useDiffOptions, useExport
├── pages/          # index.vue
├── types/          # TypeScript interfaces
└── assets/css/     # Design system (CSS variables, animations)
```
