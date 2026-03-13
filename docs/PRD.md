# Diffspot — Product Requirements Document

> Last updated: 2026-03-10

---

## 1. Product Overview

**Diffspot** is a developer-focused text diff comparison tool. Users paste two texts, click "Find Differences", and see exactly what changed — highlighted with precision. Fully client-side rendering with a Cloudflare Workers backend for server routes and D1 for persistence.

**Design language:** Dark terminal-chic aesthetic matching edufalcao.com — cyan/pink accents, JetBrains Mono, noise overlay, glow effects.

**Live stack:** Nuxt 3 + Vue 3 + TypeScript + Tailwind CSS 3 + jsdiff + CodeMirror 6 + Cloudflare Workers + D1

---

## 2. Core User Flow

1. Land on page → hero: `$ diffspot` + "Paste. Compare. Ship."
2. Paste/type text or drag-and-drop/upload files into both editors
3. Select language (syntax highlighting) and precision (line/word/char)
4. Click **Find Differences** or press `Ctrl+Enter`
5. Page auto-scrolls to diff output with stats bar
6. Toggle split/unified view, adjust options, re-diff as needed
7. Export via Print/Save as PDF
8. Clear editors or erase both inputs to dismiss results

---

## 3. Feature Status

### 3.1 Foundation & Design System

| Feature | Status | Notes |
|---|---|---|
| Nuxt 3 + Vue 3 + TypeScript | ✅ Done | |
| Tailwind CSS 3 | ✅ Done | |
| CSS design tokens (colors, fonts, effects) | ✅ Done | `main.css` |
| Noise overlay + radial gradient background | ✅ Done | `app.vue` |
| Google Fonts (Space Grotesk, DM Sans, JetBrains Mono) | ✅ Done | |
| Dark/light theme toggle | ✅ Done | `@nuxtjs/color-mode` |
| AppHeader (`$ diffspot` + GitHub link + theme toggle) | ✅ Done | |
| AppFooter (built by edufalcao.com) | ✅ Done | |
| favicon.svg | ✅ Done | |

---

### 3.2 Editors

| Feature | Status | Notes |
|---|---|---|
| CodeMirror 6 editor wrapper (`DiffEditor.vue`) | ✅ Done | |
| Side-by-side editors (Original / Modified) | ✅ Done | |
| Stacked layout on mobile | ✅ Done | `grid-cols-1 md:grid-cols-2` |
| Language selector dropdown (18+ languages) | ✅ Done | `useEditorState` |
| Syntax highlighting per language | ✅ Done | CodeMirror 6 |
| Drag-and-drop file upload | ✅ Done | Window-level drag detection with drop zones |
| Click-to-upload button per editor | ✅ Done | Hidden file input |
| Copy button (copies both editors content) | ✅ Done | |
| Clear button (clears both editors) | ✅ Done | |
| Placeholder text in empty editors | ✅ Done | |
| Editor height capped to viewport | ⚠️ Partial | No explicit max-height cap — editors grow freely; needs verification |

---

### 3.3 Diff Engine

| Feature | Status | Notes |
|---|---|---|
| Line-level diff (`Diff.diffLines`) | ✅ Done | Default precision |
| Word-level diff (`Diff.diffWords`) | ✅ Done | |
| Character-level diff (`Diff.diffChars`) | ✅ Done | |
| Inline word highlights on line diff (paired add/remove) | ✅ Done | Two-pass: line structure + word highlights |
| Ignore whitespace option | ✅ Done | |
| Ignore case option | ✅ Done | |
| On-demand diff (button-triggered, not reactive) | ✅ Done | |
| Web Worker diff computation | ✅ Done | Off-main-thread via `diff.worker.ts`; UI stays responsive on large inputs |
| Auto-clear results when both inputs are emptied | ✅ Done | `watch([leftText, rightText])` |

---

### 3.4 Diff Output Views

| Feature | Status | Notes |
|---|---|---|
| Split view (side-by-side) | ✅ Done | `DiffSplitView.vue` |
| Unified view (single column) | ✅ Done | `DiffUnifiedView.vue` |
| Line numbers gutter | ✅ Done | `DiffGutter.vue` |
| Added/removed/unchanged line styling | ✅ Done | Cyan/pink per design system |
| Inline word-level highlights | ✅ Done | `DiffLine.vue` |
| Stats bar (`+X additions, -Y removals`) | ✅ Done | `DiffStats.vue` |
| View mode toggle (Split / Unified) | ✅ Done | `DiffControls.vue` |
| Precision toggle (Line / Word / Char) | ✅ Done | `DiffControls.vue` |
| Auto-switch to Unified on mobile | ✅ Done | `index.vue` |
| Virtual scrolling for large files | ✅ Done | `useVirtualScroll` — fixed 26px row height, ~20-row overscan, print-aware |
| Synchronized scrolling in split view | ✅ Done | Proportional scroll sync (handles different panel heights) |
| "No differences found" empty state | ✅ Done | `textsAreIdentical` computed |
| Loading state while computing | ✅ Done | Spinner in button + section |
| Fade-in / slide-up animations for diff results | ✅ Done | `<Transition>` wrappers |
| Auto-scroll to diff results after compute | ✅ Done | `scrollIntoView` |
| Diff minimap sidebar | ✅ Done | `DiffMinimap.vue` + `useMinimap` — colored blocks, click/drag nav, hidden on mobile |
| Fullscreen mode | ✅ Done | `useFullscreen` — toggle via toolbar button or Escape to exit |
| Jump navigation between changes | ✅ Done | `useDiffNavigation` — prev/next buttons, `Alt+Up`/`Alt+Down` shortcuts |
| Current change highlight | ✅ Done | Ring highlight on active change group lines |

---

### 3.5 Export

| Feature | Status | Notes |
|---|---|---|
| Print / Save as PDF (browser print dialog) | ✅ Done | `usePrint` → `window.print()` |
| Print CSS (hide non-diff elements) | ✅ Done | `print:hidden` in controls |
| PNG export (DOM → canvas → image) | ❌ Not built | Originally planned with `html-to-image`; not implemented |

---

### 3.6 UX & Polish

| Feature | Status | Notes |
|---|---|---|
| Keyboard shortcut: `Ctrl/Cmd + Enter` to diff | ✅ Done | |
| Keyboard shortcut: `Alt + Up/Down` to jump between changes | ✅ Done | |
| Keyboard shortcut: `Escape` to exit fullscreen | ✅ Done | |
| Button disabled when both inputs empty | ✅ Done | |
| "Find Differences" button with spinner state | ✅ Done | |
| Fade-in animations (hero, editor, button) | ✅ Done | |
| Web Worker diff computation (non-blocking UI) | ✅ Done | Replaced `setTimeout` hack; async `compute()` via dedicated worker |
| Click-away to close language dropdown | ✅ Done | Fixed overlay |
| Copy feedback ("Copied" for 2s) | ✅ Done | |
| Large file performance | ✅ Done | Virtual scrolling + Web Worker diff — handles 10k+ lines without UI freeze |
| Keyboard navigation (ARIA / focus management) | ⚠️ Partial | `role="toolbar"` on DiffControls; no full ARIA audit |

---

### 3.7 SEO & Meta

| Feature | Status | Notes |
|---|---|---|
| Page title | ✅ Done | "diffspot — Online Text Diff Tool" |
| Meta description | ✅ Done | |
| Theme color meta | ✅ Done | `#0d0d0d` |
| OpenGraph tags (og:title, og:description, og:image) | ✅ Done | `nuxt.config.ts` + `public/og.png` (1200×630) |
| Twitter/X card meta | ✅ Done | `twitter:card`, `twitter:title`, `twitter:image` |
| Canonical URL | ✅ Done | `<link rel="canonical">` in head |

---

### 3.8 Infrastructure & Deployment

| Feature | Status | Notes |
|---|---|---|
| Nitro preset: `cloudflare-pages` | ✅ Done | Outputs `dist/_worker.js` + static assets |
| SSR disabled (SPA mode) | ✅ Done | `ssr: false` — pages render client-side |
| CI/CD pipeline | ✅ Done | GitHub Actions → `pnpm build` (tests + package builds + app build) → Cloudflare Pages on push to `main` |
| Hosting (Cloudflare Pages) | ✅ Done | `wrangler pages deploy dist` — secrets configured, build passing |
| D1 database binding | ✅ Done | `wrangler.toml` + dashboard binding → `env.DB` available in Workers |
| D1 schema migrations | ✅ Done | `migrations/` directory; run via `wrangler d1 execute --remote` |
| `/ping` health check route | ✅ Done | Logs IP, country, user agent, ray ID + returns `total_pings` count from D1 |

---

## 4. Gaps Summary

### Must-Have (before launch)
| # | Item | Priority |
|---|---|---|
| 1 | ~~OG meta tags~~ | ✅ Done |
| 2 | ~~Canonical URL~~ | ✅ Done |
| 3 | Full ARIA audit (keyboard nav, focus management) | High |
| 4 | ~~Editor height cap / large file handling~~ | ✅ Done (virtual scrolling + Web Worker) |

### Nice-to-Have (post-launch)
| # | Item | Priority |
|---|---|---|
| 6 | Shareable diff via URL (encode diff state in hash/query params) | Medium |
| 7 | ~~Synced scrolling QA + fix if broken~~ | ✅ Done (proportional sync) |
| 8 | PNG export (`html-to-image`) | Low |
| 9 | PR preview deployments (Cloudflare Pages preview URLs) | Low |

---

## 5. Out of Scope

- User accounts / authentication
- Real-time collaborative editing
- Diff history per user

---

## 6. Verification Checklist (pre-launch)

- [ ] `pnpm dev` — app renders, theme matches edufalcao.com
- [ ] `pnpm build` — package tests pass and `dist/` is generated with `_worker.js`
- [ ] Diff accuracy: paste known pairs, verify additions/removals
- [ ] Split view + synced scrolling QA
- [ ] Unified view QA
- [ ] File upload: drag `.txt`, `.js`, `.py` — verify content loads
- [ ] Mobile: resize to 375px — unified auto-switch, stacked editors
- [ ] Theme toggle: dark/light — all components respect CSS vars
- [ ] `Ctrl+Enter` shortcut works
- [ ] Print / Save as PDF — diff renders correctly
- [ ] `/ping` returns `message`, `request`, and `total_pings`
- [ ] No console errors on fresh load
