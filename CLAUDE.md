# Diffspot

Online text diff comparison tool with a dark terminal-chic aesthetic (matching edufalcao.com style).

## Tech Stack

| Layer | Technology | Docs |
|-------|-----------|------|
| Framework | Nuxt 3 (Vue 3 + TypeScript, compat v4) | https://nuxt.com/docs |
| UI Framework | Vue 3 | https://vuejs.org/ |
| Styling | Tailwind CSS 3 | https://tailwindcss.com/docs/installation |
| Diff engine | jsdiff (`diff`) | https://github.com/kpdecker/jsdiff |
| Code editors | CodeMirror 6 via `vue-codemirror` | https://codemirror.net/docs/ / https://github.com/surmon-china/vue-codemirror |
| Export | Multi-format (Print/PDF, .diff, .html, .json) | `@diffspot/core` export generators + `useExport` composable |
| Icons | Lucide Vue Next | https://lucide.dev/guide/packages/lucide-vue-next |
| Fonts | @nuxtjs/google-fonts | https://google-fonts.nuxtjs.org/ |
| Runtime | Cloudflare Workers | `nitro.preset = 'cloudflare-pages'` |
| Database | Cloudflare D1 (SQLite) | https://developers.cloudflare.com/d1/ |

## Design System

- **Dark mode default** — Background: `#0d0d0d`, Surface: `#1a1a1a`, Elevated: `#242424`
- **Accent colors** — Cyan: `#00e5cc`, Pink: `#ff006e`
- **Fonts** — Space Grotesk (headings), DM Sans (body), JetBrains Mono (code/editors)
- **Effects** — Noise overlay, radial gradient background, glow on hover, fade-in/slide-up animations
- **Diff colors** — Added: cyan-tinted, Removed: pink-tinted

## Commands

```bash
pnpm dev            # Start dev server
pnpm build          # Build for production (outputs to dist/)
pnpm preview        # Preview production build
pnpm test:packages  # Run package tests
pnpm lint           # Run ESLint
pnpm typecheck      # Run Nuxt typecheck
```

## Verification

After finishing any implementation work, run this full verification checklist before considering the task complete:

```bash
pnpm test:packages
pnpm lint
pnpm typecheck
pnpm build
```

If one of these steps cannot be run or fails for an external reason, call that out explicitly in the handoff.

## Release Workflow

When cutting a release, use this order as the default standard:

1. Finish the implementation.
2. Run the full verification checklist:
   - `pnpm test:packages`
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm build`
3. Bump package versions if `@diffspot/core` or `@diffspot/vue` changed in a way that should be published.
4. Commit the release-ready state, including any version bumps.
5. Push `main`.
6. Create the git tag from that pushed commit.
7. Push the tag.
8. Publish the npm packages from that tagged state, if package publishing is needed.
9. Create the GitHub release from the same tag, with notes summarizing the changes since the previous release.

Notes:

- Do not publish npm packages before the release commit and tag are pushed.
- If no package contents changed, skip the npm publish step.
- If a publish step fails after the tag exists, fix forward with a new version instead of reusing the same published version number.

## Build Output

With `nitro.preset = 'cloudflare-pages'`, `pnpm build` outputs to `dist/`:
- `dist/_worker.js` — Cloudflare Worker (handles server routes)
- `dist/_nuxt/` — static client assets
- `dist/index.html` — SPA shell

Deployed via `wrangler pages deploy dist --project-name=diffspot`.

## Database (D1)

D1 binding is configured in `wrangler.toml` and the Cloudflare Pages dashboard (variable: `DB`).

Access in server routes:
```ts
const DB = event.context.cloudflare.env.DB as D1Database
```

Run migrations:
```bash
npx wrangler d1 execute diffspot --file=./migrations/<file>.sql --remote
```

## Server Routes

Located in `server/routes/`. Compiled into the Cloudflare Worker.

- `GET /ping` — health check; logs request metadata to D1 `healthcheck` table and returns `total_pings`

## Project Structure

Key directories:
- `app/components/` — Vue components (layout, editor, diff, ui)
- `app/composables/` — Shared reactive logic (useDiff, useEditorState, useDiffOptions, useExport, useDiffNavigation, useFullscreen, useMinimap, useVirtualScroll, useSyntaxHighlight)
- `app/utils/` — Pure utility functions (textFiles — file type detection and validation)
- `app/workers/` — Web Workers (diff.worker — off-main-thread diff computation)
- `app/pages/` — Nuxt file-based routing (index.vue only)
- `app/types/` — TypeScript interfaces
- `app/assets/css/` — Global styles and CSS variables
- `server/routes/` — Cloudflare Workers server routes
- `migrations/` — D1 SQL migration files
- `docs/` — PRD

## Conventions

- Use TypeScript throughout
- Use Composition API with `<script setup>` syntax
- Use Tailwind utility classes; design tokens via CSS variables
- Components follow PascalCase naming
- Composables follow `use*` naming convention
- Server routes follow `<name>.<method>.ts` naming (e.g. `ping.get.ts`)
- D1 migrations follow `NNNN_description.sql` naming (e.g. `0001_create_healthcheck.sql`)
- Pure computation logic lives in `app/utils/` for Web Worker compatibility (no Vue/DOM imports)
- Web Workers live in `app/workers/` and use `new URL('../workers/<name>.ts', import.meta.url)` for Vite bundling
