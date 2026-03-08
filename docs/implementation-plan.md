# Diffspot - Implementation Plan

## Context

Build **diffspot**, a developer-focused online text diff comparison tool (like diffchecker.com) from scratch. The app must match the UI style of edufalcao.com — dark terminal-chic aesthetic with cyan/pink accents, Space Grotesk + JetBrains Mono fonts, noise overlays, and glow effects. The app is fully static (client-side only) and can be deployed to any static host.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Nuxt 4** (Vue 3 + TypeScript) | Matches edufalcao.com stack; static site generation |
| Styling | **Tailwind CSS 4** | Matches edufalcao.com; utility-first |
| Diff engine | **`diff` (jsdiff)** | Mature; supports line/word/char diffs; ~15 KB |
| Code editors | **CodeMirror 6** via `vue-codemirror` | Lightweight, extensible, 100+ languages |
| Export | **`html-to-image`** + **`jsPDF`** | Client-side PNG/PDF generation |
| Icons | **Lucide Vue** | Minimal, tree-shakeable |
| Fonts | **`@nuxtjs/google-fonts`** | Space Grotesk, DM Sans, JetBrains Mono |

---

## Project Structure

```
diffspot/
├── nuxt.config.ts
├── package.json
├── app.vue                          # Root layout: noise overlay + radial gradient
├── assets/css/main.css              # CSS vars, keyframes, base styles
├── components/
│   ├── layout/
│   │   ├── AppHeader.vue            # "$ diffspot" logo + theme toggle
│   │   ├── AppFooter.vue            # "Built with Nuxt & Tailwind"
│   │   └── ThemeToggle.vue
│   ├── editor/
│   │   ├── DiffEditor.vue           # CodeMirror 6 wrapper
│   │   └── EditorPair.vue           # Toolbar + two editors side-by-side
│   ├── diff/
│   │   ├── DiffView.vue             # Switches between split/unified
│   │   ├── DiffSplitView.vue        # Side-by-side with synced scroll
│   │   ├── DiffUnifiedView.vue      # Single-column unified view
│   │   ├── DiffLine.vue             # Single line (added/removed/unchanged)
│   │   ├── DiffGutter.vue           # Line numbers column
│   │   ├── DiffStats.vue            # "+12 additions, -5 removals"
│   │   └── DiffControls.vue         # View toggle, options, export
│   └── ui/
│       ├── GlowButton.vue           # Button with hover glow effect
│       ├── ToggleGroup.vue          # Segmented control
│       ├── DropdownMenu.vue
│       ├── GradientText.vue         # Cyan-to-pink gradient text
│       └── ShellPrompt.vue          # "$ diff a.txt b.txt" decorator
├── composables/
│   ├── useDiff.ts                   # Core diff computation (jsdiff)
│   ├── useEditorState.ts            # Reactive state for both editors
│   ├── useDiffOptions.ts            # Precision, ignore whitespace/case
│   └── useExport.ts                 # PNG/PDF export
├── pages/
│   └── index.vue                    # Main diff tool
├── server/
│   └── tsconfig.json
├── public/favicon.svg
└── types/diff.ts                    # TypeScript interfaces
```

---

## Design System (matching edufalcao.com)

**Colors (dark mode default):**
- Background: `#0d0d0d` | Surface: `#1a1a1a` | Elevated: `#242424`
- Text: `#f5f5f5` | Muted: `#8b8b8b`
- Accent cyan: `#00e5cc` | Accent pink: `#ff006e`
- Border: `hsla(0,0%,100%,.08)`

**Diff-specific colors:**
- Added bg: `rgba(0,229,204,.08)` | Added highlight: `rgba(0,229,204,.25)`
- Removed bg: `rgba(255,0,110,.08)` | Removed highlight: `rgba(255,0,110,.25)`

**Typography:** Space Grotesk (headings), DM Sans (body), JetBrains Mono (editors/code)

**Effects:** Noise overlay (SVG feTurbulence), radial gradient background, glow on hover, fade-in/slide-up animations

---

## Implementation Phases (Multi-Agent)

Each phase below is designed so that work units within it can run **in parallel via isolated worktree agents**. Each agent owns distinct files to avoid merge conflicts.

---

### Step 1: Scaffolding + Design System _(sequential, main branch)_

Runs first — everything else depends on this.

- `npx nuxi init` with TypeScript
- Install & configure Tailwind CSS 4 with design tokens from edufalcao.com
- Set up `main.css` — CSS variables, noise overlay, radial gradient, keyframes
- Configure Google Fonts (Space Grotesk, DM Sans, JetBrains Mono)
- Build layout components: `AppHeader`, `AppFooter`, `ThemeToggle`
- Create `app.vue` with root layout
- Create `pages/index.vue` with placeholder content
- **Result:** Empty shell that looks like edufalcao.com

---

### Step 2: Core Building Blocks _(3 agents in parallel, worktrees)_

After Step 1 is committed, spawn these agents simultaneously:

#### Agent A — UI Primitives
**Files owned:** `components/ui/*`
- `GlowButton.vue` — button with hover glow effect
- `ToggleGroup.vue` — segmented control (split/unified toggle)
- `DropdownMenu.vue` — for language selector, export options
- `GradientText.vue` — cyan-to-pink gradient text wrapper
- `ShellPrompt.vue` — `"$ diff a.txt b.txt"` decorative element

#### Agent B — Editor Components
**Files owned:** `components/editor/*`, `composables/useEditorState.ts`
- Install CodeMirror 6 packages + `vue-codemirror`
- `DiffEditor.vue` — CodeMirror 6 wrapper with dark theme, JetBrains Mono, line numbers
- `EditorPair.vue` — toolbar (language selector, copy, clear, upload) + two editors side-by-side (desktop) / stacked (mobile)
- `useEditorState.ts` — reactive state for both editors (leftText, rightText, language)

#### Agent C — Diff Engine
**Files owned:** `composables/useDiff.ts`, `composables/useDiffOptions.ts`, `types/diff.ts`
- Install `diff` (jsdiff)
- Define TypeScript interfaces in `types/diff.ts`
- `useDiff.ts` — on-demand diff computation (triggered by button, not reactive):
  - Line-level: `Diff.diffLines()`
  - Two-pass: line structure + word-level inline highlights via `Diff.diffWords()`
  - Character-level: `Diff.diffChars()`
- `useDiffOptions.ts` — precision, ignore whitespace, ignore case

**Merge:** After all 3 agents complete, merge their worktree branches into main.

---

### Step 3: Diff Views + Export _(2 agents in parallel, worktrees)_

After Step 2 is merged, spawn these agents simultaneously:

#### Agent D — Diff Output Views
**Files owned:** `components/diff/*`
- `DiffLine.vue` — single line with add/remove/unchanged styling + inline highlights
- `DiffGutter.vue` — line numbers column
- `DiffUnifiedView.vue` — single column, `+`/`-` prefixes
- `DiffSplitView.vue` — dual column, synchronized scrolling via `requestAnimationFrame`
- `DiffView.vue` — container that switches between split/unified
- `DiffControls.vue` — view toggle, precision, ignore options, export button
- `DiffStats.vue` — `"+12 additions, -5 removals"` summary bar

#### Agent E — Export Logic
**Files owned:** `composables/useExport.ts`
- Install `html-to-image` + `jsPDF`
- `useExport.ts` — PNG export (DOM to canvas) and PDF export (image embedded in jsPDF)

**Merge:** After both agents complete, merge their worktree branches into main.

---

### Step 4: Integration + Main Page _(sequential, main branch)_

Wire everything together in `pages/index.vue`:
- Connect `EditorPair` → `useDiff` → `DiffView` pipeline
- Wire "Find Differences" button to trigger diff computation
- Connect `DiffControls` to export composable
- Auto-scroll to diff results after computation
- Clear diff results when both inputs are emptied
- Verify full end-to-end flow works

---

### Step 5: Polish & Responsive _(2 agents in parallel, worktrees)_

#### Agent F — UX Polish
**Files owned:** modifications to existing components (animations, states, shortcuts)
- Loading states + animations (fade-in diff results, slide-up)
- Empty states with terminal placeholder text
- Keyboard shortcuts (Ctrl+Enter to diff)
- Error handling (empty input, large files)
- Editor height capped to viewport with internal scrolling

#### Agent G — SEO + Accessibility
**Files owned:** `pages/index.vue` (meta only), `nuxt.config.ts` (meta only)
- OpenGraph meta tags
- Accessibility (ARIA labels, focus management, keyboard navigation)
- Mobile responsive refinements (auto-unified fallback on small screens)
- `favicon.svg`

**Merge:** Final merge into main.

---

## Deployment

The app is configured for static site generation:

```bash
npx nuxt generate
```

Output is in `.output/public/` and can be deployed to any static host (Vercel, Netlify, GitHub Pages, S3, Cloudflare Pages, etc.).

---

## UX Flow

1. User lands on page: `$ diffspot` in gradient text, subtitle "Paste. Compare. Ship.", two empty editors
2. Paste/type text or drag-and-drop/upload files into both editors; select language
3. Click "Find Differences" (glowing cyan button) or press Ctrl+Enter
4. Page scrolls to diff output with stats bar
5. Toggle split/unified, adjust precision, toggle ignore options; re-click button to recompute
6. Export as PNG/PDF
7. Clear editors or erase both inputs to dismiss diff results

---

## Verification

1. **Dev server:** `npm run dev` — verify all pages render, theme matches edufalcao.com
2. **Static build:** `npx nuxt generate` — verify `.output/public` is generated
3. **Diff accuracy:** Paste known text pairs, verify additions/removals match expected output
4. **View modes:** Toggle split/unified, verify layout and synced scrolling
5. **File upload:** Drag `.txt`, `.js`, `.py` files or use upload button — verify content loads into editors
6. **Export:** Download PNG and PDF — verify diff renders correctly in both
7. **Mobile:** Resize to mobile viewport — verify stacked layout and unified fallback
8. **Theme:** Toggle dark/light — verify all components respect theme variables
