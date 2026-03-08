# Diffspot

Online text diff comparison tool with a dark terminal-chic aesthetic (matching edufalcao.com style).

## Tech Stack

| Layer | Technology | Docs |
|-------|-----------|------|
| Framework | Nuxt 4 (Vue 3 + TypeScript) | https://nuxt.com/docs |
| UI Framework | Vue 3 | https://vuejs.org/ |
| Styling | Tailwind CSS 4 | https://tailwindcss.com/docs/installation |
| Diff engine | jsdiff (`diff`) | https://github.com/kpdecker/jsdiff |
| Code editors | CodeMirror 6 via `vue-codemirror` | https://codemirror.net/docs/ / https://github.com/surmon-china/vue-codemirror |
| Print / Export | Browser print dialog | Native `window.print()` with print CSS |
| Icons | Lucide Vue Next | https://lucide.dev/guide/packages/lucide-vue-next |
| Fonts | @nuxtjs/google-fonts | https://google-fonts.nuxtjs.org/ |

## Design System

- **Dark mode default** — Background: `#0d0d0d`, Surface: `#1a1a1a`, Elevated: `#242424`
- **Accent colors** — Cyan: `#00e5cc`, Pink: `#ff006e`
- **Fonts** — Space Grotesk (headings), DM Sans (body), JetBrains Mono (code/editors)
- **Effects** — Noise overlay, radial gradient background, glow on hover, fade-in/slide-up animations
- **Diff colors** — Added: cyan-tinted, Removed: pink-tinted

## Commands

```bash
npm run dev         # Start dev server
npm run build       # Build for production
npx nuxt generate   # Generate static site (.output/public/)
npm run preview     # Preview production build
```

## Project Structure

See `docs/implementation-plan.md` for the full project structure and implementation phases.

Key directories:
- `components/` — Vue components (layout, editor, diff, ui)
- `composables/` — Shared reactive logic (useDiff, useEditorState, useDiffOptions, useExport)
- `pages/` — Nuxt file-based routing (index.vue only)
- `types/` — TypeScript interfaces
- `assets/css/` — Global styles and CSS variables

## Conventions

- Use TypeScript throughout
- Use Composition API with `<script setup>` syntax
- Use Tailwind utility classes; design tokens via CSS variables
- Components follow PascalCase naming
- Composables follow `use*` naming convention
