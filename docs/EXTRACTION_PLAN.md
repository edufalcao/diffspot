# Diffspot Library Extraction Plan

Strategy for extracting diffspot's diff functionality into two publishable npm packages.

## Package Overview

| Package | Scope | Framework | Target consumers |
|---------|-------|-----------|-----------------|
| `@diffspot/core` | Pure diff computation, types, Web Worker helper | None (works in Node, browser, worker) | Any JS/TS project |
| `@diffspot/vue` | Vue 3 components + composables | Vue 3 | Vue/Nuxt apps |

`@diffspot/vue` depends on `@diffspot/core` as a peer dependency.

---

## Execution Strategy — Parallel Work

The two phases have significant opportunities for parallel execution. This section maps out what can run concurrently and what must be sequential.

### Cross-phase parallelism

Phase 2 **adaptation work** (removing Nuxt auto-imports, inlining UI deps, replacing icons) can start at the same time as all of Phase 1. This refactoring only depends on knowing the final `@diffspot/core` API shape — which is defined in this plan — not on the package being built or published. Use placeholder imports (e.g. `from '@diffspot/core'`) during development and they'll resolve once the monorepo workspace is wired up.

```
TIME ──────────────────────────────────────────────────────────────►

Phase 1 ─ @diffspot/core
┌─────────────────────┬──────────────────┬─────────┬──────────────┐
│ A: Scaffold package │ B: Copy & adapt  │ Build + │ Publish core │
│    + build config   │    source files  │ verify  │              │
│                     │                  │         │              │
│ C: Write tests      │ (from existing   │         │              │
│    (from source)    │  source files)   │         │              │
└─────────────────────┴──────────────────┴─────────┴──┬───────────┘
                                                      │
Phase 2 ─ @diffspot/vue                               │
┌───────────────────────────────────────┐              │
│ D: De-Nuxt-ify composables (all 5)   │              │
│    (add explicit imports, remove      │  ┌──────────┴──────────┐
│     local computeChangeGroups, use    │  │ Wire real            │
│     placeholder @diffspot/core        │  │ @diffspot/core       │
│     imports)                          │  │ imports, build +     │
│                                       ├─►│ test, publish vue    │
│ E: De-Nuxt-ify leaf components        │  │                      │
│    (DiffLine, DiffGutter, DiffStats   │  │                      │
│     — zero cross-deps)                │  │                      │
│                                       │  │                      │
│ F: Refactor DiffControls              │  │                      │
│    (inline ToggleGroup + GlowButton,  │  │                      │
│     replace lucide icons)             │  │                      │
│                                       │  │                      │
│ G: Extract theme.css + write docs     │  │                      │
└───────────────────────────────────────┘  └─────────────────────┘

THEN (sequential) ──────────────────────────────────────────────────
┌───────────────────────────────────────────────────────────────────┐
│ H: Update diffspot app to consume both packages                   │
│    Verify end-to-end                                              │
└───────────────────────────────────────────────────────────────────┘
```

### Within Phase 1 — three parallel tracks

| Track | Work | Dependencies |
|-------|------|-------------|
| **A** | Scaffold package (package.json, tsconfig, tsup/unbuild config) | None |
| **B** | Copy & adapt source files (types, compute, minimap, navigation, worker, barrel) | None |
| **C** | Write tests (can be authored against current source files before they're moved) | None |

Converge: wire tests into the scaffolded package, run build, verify.

### Within Phase 2 — four parallel tracks

| Track | Work | Dependencies |
|-------|------|-------------|
| **D** | Adapt all 5 composables (each is independent: useDiff, useDiffOptions, useDiffNavigation, useVirtualScroll, useExport) | None — use placeholder `@diffspot/core` imports |
| **E** | Adapt leaf components — DiffLine, DiffGutter, DiffStats have zero internal cross-deps | None |
| **F** | Refactor DiffControls — the most involved component change (inline ToggleGroup + GlowButton, replace lucide icons with SVGs/slots) | None |
| **G** | Extract theme.css + write README/docs | None |

Converge (sequential within Phase 2):
1. DiffMinimap depends on **D** (useVirtualScroll) and **E** (component patterns established)
2. DiffSplitView + DiffUnifiedView depend on **D** (composables) + **E** (DiffLine, DiffGutter, DiffMinimap done)
3. DiffView depends on SplitView + UnifiedView being done
4. Barrel exports + build after all components are ready
5. Wire real `@diffspot/core` imports after Phase 1 publishes

### Strict sequential constraints

These cannot be parallelized:

1. `@diffspot/core` must **build and pass tests** before `@diffspot/vue` can run its full test suite (composables need the real package)
2. `@diffspot/core` must be **published to npm** before `@diffspot/vue` is published (peer dependency)
3. Updating the diffspot app to consume both packages comes **last**, after both are verified independently

---

## Phase 1 — `@diffspot/core`

### What goes in

| Source file | Destination | Changes needed |
|-------------|-------------|----------------|
| `app/types/diff.ts` | `src/types.ts` | Remove `ChangeGroup` (move to vue pkg). Export everything from index. |
| `app/utils/diffCompute.ts` | `src/compute.ts` | Update import path for types. No logic changes. |
| `app/workers/diff.worker.ts` | `src/worker.ts` | Update import paths. |
| `app/composables/useMinimap.ts` | `src/minimap.ts` | Update import path. Move `MinimapBlock` interface to `src/types.ts`. Already framework-agnostic — `computeMinimapBlocks` is a pure function. |
| *(new)* | `src/navigation.ts` | Extract `computeChangeGroups()` from `useDiffNavigation.ts` (lines 7-30) as a pure function. Move `ChangeGroup` type here (re-export from types). |
| *(new)* | `src/index.ts` | Barrel export for all public API. |

### Public API surface

```ts
// Types
export type { DiffPrecision, DiffWord, DiffLine, DiffResult, DiffOptions, ChangeGroup, MinimapBlock }

// Computation
export { computeDiff } from './compute'

// Utilities
export { computeMinimapBlocks } from './minimap'
export { computeChangeGroups } from './navigation'
```

### Steps

Steps 1-3 map to parallel tracks A, B, C from the [execution strategy](#execution-strategy--parallel-work). Start all three simultaneously.

1. **Scaffold the package** *(Track A)*
   - Create `packages/core/` directory in a new monorepo (or standalone repo — see [Repo structure](#repo-structure) below).
   - `package.json` with `name: "@diffspot/core"`, `type: "module"`, `exports` field for ESM + CJS.
   - Minimal `tsconfig.json` targeting `ES2020`, `moduleResolution: "bundler"`.
   - Add `diff` (jsdiff) `^8.0.3` as the sole runtime dependency.
   - Add `@types/diff` `^7.0.2` as a dev dependency.
   - Set up build tooling — use `tsup` or `unbuild` to produce ESM + CJS bundles.
   - Configure `exports` in `package.json`:
     ```json
     {
       "exports": {
         ".": {
           "import": "./dist/index.mjs",
           "require": "./dist/index.cjs",
           "types": "./dist/index.d.ts"
         },
         "./worker": {
           "import": "./dist/worker.mjs",
           "types": "./dist/worker.d.ts"
         }
       }
     }
     ```
   - The worker entry is separate so bundlers can handle it with their worker plugins.

2. **Copy and adapt source files** *(Track B)*
   - Copy `app/types/diff.ts` → `packages/core/src/types.ts`.
   - Add `MinimapBlock` interface (from `useMinimap.ts`) to `types.ts`.
   - Copy `app/utils/diffCompute.ts` → `packages/core/src/compute.ts`. Update import to `./types`.
   - Copy `app/composables/useMinimap.ts` → `packages/core/src/minimap.ts`. Remove `~/types/diff` import, use `./types`. Keep only the `computeMinimapBlocks` function (drop the `MinimapBlock` interface since it's now in types).
   - Extract `computeChangeGroups` function from `app/composables/useDiffNavigation.ts` (lines 7-30) → `packages/core/src/navigation.ts`. Pure function, no Vue imports.
   - Copy `app/workers/diff.worker.ts` → `packages/core/src/worker.ts`. Update imports.
   - Create `packages/core/src/index.ts` barrel file.

3. **Write tests** *(Track C — can start from existing source files before they're moved)*
   - Add `vitest` as dev dependency.
   - Port/write tests covering:
     - `computeDiff` with all 3 precision modes (line, word, char).
     - `computeDiff` with `ignoreWhitespace` and `ignoreCase` options.
     - `computeMinimapBlocks` with empty input, single-type blocks, mixed blocks.
     - `computeChangeGroups` with no changes, single group, multiple groups, mixed types.
     - Edge cases: empty strings, identical strings, completely different strings.

4. **Converge, build, verify** *(sequential — after tracks A+B+C complete)*
   - Wire tests into the scaffolded package.
   - Run build. Run full test suite. Fix any issues.

5. **Documentation**
   - `README.md` with install instructions, quick start, API reference.
   - JSDoc already exists on all public functions — ensure it transfers cleanly.

6. **Update diffspot to consume `@diffspot/core`** *(deferred to after Phase 2 — see step H in execution strategy)*
   - Replace `~/utils/diffCompute` imports with `@diffspot/core`.
   - Replace `~/types/diff` imports with `@diffspot/core`.
   - Replace `computeMinimapBlocks` import with `@diffspot/core`.
   - Remove the extracted source files from `app/`.
   - Verify diffspot still works end-to-end.

---

## Phase 2 — `@diffspot/vue`

### What goes in

| Source file | Destination | Changes needed |
|-------------|-------------|----------------|
| `app/components/diff/DiffLine.vue` | `src/components/DiffLine.vue` | Replace Nuxt auto-imports with explicit imports. CSS variable references stay (theming via CSS vars). |
| `app/components/diff/DiffGutter.vue` | `src/components/DiffGutter.vue` | Replace Nuxt auto-imports. |
| `app/components/diff/DiffMinimap.vue` | `src/components/DiffMinimap.vue` | Replace Nuxt auto-imports. Import `computeMinimapBlocks` from `@diffspot/core`. |
| `app/components/diff/DiffSplitView.vue` | `src/components/DiffSplitView.vue` | Replace Nuxt auto-imports (`useVirtualScroll`). Explicit component registration. |
| `app/components/diff/DiffUnifiedView.vue` | `src/components/DiffUnifiedView.vue` | Same as SplitView. |
| `app/components/diff/DiffView.vue` | `src/components/DiffView.vue` | Replace Nuxt auto-imports. Register child components explicitly. |
| `app/components/diff/DiffStats.vue` | `src/components/DiffStats.vue` | No changes needed — pure presentational. |
| `app/components/diff/DiffControls.vue` | `src/components/DiffControls.vue` | Remove lucide-vue-next icons — replace with slots or inline SVGs. Remove `UiToggleGroup` / `UiGlowButton` deps — inline simplified versions or use slots. |
| `app/composables/useDiff.ts` | `src/composables/useDiff.ts` | Import `computeDiff` from `@diffspot/core`. Update worker import path. |
| `app/composables/useDiffOptions.ts` | `src/composables/useDiffOptions.ts` | Import types from `@diffspot/core`. |
| `app/composables/useDiffNavigation.ts` | `src/composables/useDiffNavigation.ts` | Import `computeChangeGroups` from `@diffspot/core`. Remove the local `computeChangeGroups` function. |
| `app/composables/useVirtualScroll.ts` | `src/composables/useVirtualScroll.ts` | No changes — already uses explicit Vue imports. |
| `app/composables/useExport.ts` | `src/composables/useExport.ts` | Trivial — just `window.print()`. |

### Key challenges and solutions

#### 1. Nuxt auto-imports → explicit imports

Every `.vue` file and composable uses Nuxt auto-imports for Vue APIs and composables. Each file needs explicit imports added:

```ts
// Before (Nuxt auto-import)
const foo = ref(0)
const bar = useVirtualScroll(...)

// After (explicit)
import { ref } from 'vue'
import { useVirtualScroll } from '../composables/useVirtualScroll'
const foo = ref(0)
const bar = useVirtualScroll(...)
```

Files that already have explicit imports (most composables do): `useDiff.ts`, `useDiffOptions.ts`, `useDiffNavigation.ts`, `useVirtualScroll.ts`, `DiffSplitView.vue`, `DiffUnifiedView.vue`, `DiffMinimap.vue`.

Files that rely on auto-imports: `DiffControls.vue` (uses `computed` without import), `GlowButton.vue` (uses `computed` without import).

#### 2. CSS theming strategy

All components reference CSS custom properties (`var(--color-accent)`, etc.) via Tailwind classes. This is actually a **good pattern for a library** — consumers just define the CSS variables.

Approach:
- Ship a default CSS file (`dist/theme.css`) with the dark/light variable definitions from `main.css` (only the `:root` and `.light` blocks — lines 7-58).
- Document that consumers can either import the default theme or define their own CSS variables.
- No need to change any component templates — they already use `var()` references.

Required CSS variables the consumer must define:
```css
--color-surface
--color-elevated
--color-text
--color-muted
--color-accent       /* added/positive color */
--color-accent-2     /* removed/negative color */
--color-border
--color-bg
--color-added-bg
--color-added-highlight
--color-removed-bg
--color-removed-highlight
--glow-accent
--font-mono
--font-body
--ease
--duration
```

#### 3. DiffControls dependencies

`DiffControls.vue` depends on:
- `UiToggleGroup` — simple toggle component (44 lines). Inline a simplified version directly in the package rather than pulling the full UI lib.
- `UiGlowButton` — button with glow effect (51 lines). Same approach — inline a minimal version.
- `lucide-vue-next` icons (`Printer`, `Maximize2`, `Minimize2`, `ChevronUp`, `ChevronDown`) — replace with named slots or inline SVG to avoid the dependency.

Recommended approach: provide a **headless `DiffControls`** that exposes slots for action buttons and toggle UI, with a default rendering that uses inline SVGs. This way consumers can override with their own icon library.

#### 4. Worker bundling

The `useDiff.ts` composable creates a Web Worker via `new URL('../workers/diff.worker.ts', import.meta.url)`. This pattern works with Vite but not necessarily with other bundlers.

Approach:
- Export the worker file as a separate entry point (`@diffspot/vue/worker`).
- Provide a `createDiffWorker` factory function that consumers can override.
- Default implementation uses the inline worker pattern; document how to configure for webpack/other bundlers.
- Include a sync-only fallback (already exists in `useDiff.ts`).

### Steps

Steps 1-5 map to parallel tracks D, E, F, G from the [execution strategy](#execution-strategy--parallel-work). Start all four simultaneously, alongside Phase 1.

1. **Scaffold the package** *(start immediately)*
   - Create `packages/vue/` directory.
   - `package.json`:
     - `name: "@diffspot/vue"`
     - `peerDependencies`: `vue ^3.3.0`, `@diffspot/core ^0.1.0`
     - No other runtime dependencies.
   - `tsconfig.json` extending a shared base, with Vue-specific settings.

2. **Adapt composables** *(Track D — parallel with E, F, G)*
   - Copy all diff-related composables to `packages/vue/src/composables/`.
   - All 5 composables are independent of each other — work on them simultaneously.
   - Replace `~/types/diff` → `@diffspot/core` (placeholder import — resolves via workspace).
   - Replace `~/utils/diffCompute` → `@diffspot/core`.
   - Replace `~/composables/useMinimap` → `@diffspot/core` (for `computeMinimapBlocks`).
   - Remove `computeChangeGroups` from `useDiffNavigation.ts` — import from `@diffspot/core`.
   - Verify all Vue imports are explicit.

3. **Adapt leaf components** *(Track E — parallel with D, F, G)*
   - Copy DiffLine, DiffGutter, DiffStats to `packages/vue/src/components/`.
   - These three have zero cross-dependencies — work on them simultaneously.
   - Add explicit imports for Vue APIs where missing.
   - Add explicit component registration (no more Nuxt auto-registration).

4. **Refactor DiffControls** *(Track F — parallel with D, E, G)*
   - This is the most involved component change, so it gets its own track.
   - Inline simplified ToggleGroup and GlowButton (or use slots).
   - Replace lucide icons with inline SVGs or named slots.
   - Add missing explicit `computed` import.

5. **Extract theme CSS + documentation** *(Track G — parallel with D, E, F)*
   - Extract `:root` and `.light` blocks from `main.css` → `packages/vue/src/theme.css`.
   - Only include the CSS variable definitions — no base styles, no scrollbar, no animations.
   - Start writing `README.md` with install, quick start, theming guide, component props reference.

6. **Adapt container components** *(sequential — after tracks D+E converge)*
   - DiffMinimap depends on composables (D) and leaf component patterns (E).
   - DiffSplitView + DiffUnifiedView depend on composables (D) + leaf components (DiffLine, DiffGutter, DiffMinimap).
   - DiffView depends on SplitView + UnifiedView being done.
   - Add explicit component registration throughout.

7. **Build tooling + barrel exports** *(sequential — after all components ready)*
   - Use `vite` in library mode (or `unbuild` with Vue plugin) to produce ESM + CJS.
   - Configure `vue` as external.
   - Ship `.vue` source files alongside compiled output for tree-shaking and IDE support.
   - `exports`:
     ```json
     {
       "exports": {
         ".": {
           "import": "./dist/index.mjs",
           "require": "./dist/index.cjs",
           "types": "./dist/index.d.ts"
         },
         "./theme.css": "./dist/theme.css"
       }
     }
     ```
   - `src/index.ts`: export all components and composables.
     ```ts
     // Components
     export { default as DiffView } from './components/DiffView.vue'
     export { default as DiffSplitView } from './components/DiffSplitView.vue'
     export { default as DiffUnifiedView } from './components/DiffUnifiedView.vue'
     export { default as DiffLine } from './components/DiffLine.vue'
     export { default as DiffGutter } from './components/DiffGutter.vue'
     export { default as DiffMinimap } from './components/DiffMinimap.vue'
     export { default as DiffControls } from './components/DiffControls.vue'
     export { default as DiffStats } from './components/DiffStats.vue'

     // Composables
     export { useDiff } from './composables/useDiff'
     export { useDiffOptions } from './composables/useDiffOptions'
     export { useDiffNavigation } from './composables/useDiffNavigation'
     export { useVirtualScroll, VIRTUAL_SCROLL_ITEM_HEIGHT } from './composables/useVirtualScroll'
     export { usePrint } from './composables/useExport'

     // Re-export core for convenience
     export * from '@diffspot/core'
     ```

8. **Wire real `@diffspot/core` + test** *(sequential — after Phase 1 completes)*
   - Replace placeholder imports with real `@diffspot/core` (should just work via pnpm workspace).
   - Run build. Verify types resolve.
   - Add `vitest` + `@vue/test-utils`.
   - Test composables: `useDiff` (mock worker, verify result ref), `useDiffOptions` (reactivity), `useDiffNavigation` (change group tracking), `useVirtualScroll` (index computation).
   - Test components: mount `DiffLine` with different line types, `DiffStats` with various counts, `DiffView` with split/unified toggle.

9. **Finalize documentation**
   - Complete `README.md` (started in track G) with full API reference.
   - Example showing minimal usage:
     ```vue
     <script setup>
     import { ref } from 'vue'
     import { DiffView, DiffControls, DiffStats, useDiff, useDiffOptions } from '@diffspot/vue'
     import '@diffspot/vue/theme.css'

     const left = ref('hello\nworld')
     const right = ref('hello\nearth')
     const { precision, ignoreWhitespace, ignoreCase, options } = useDiffOptions()
     const { result, compute } = useDiff(left, right, options)

     compute()
     </script>
     ```

10. **Update diffspot to consume both packages** *(step H — last, after both packages verified)*
    - Replace all diff component imports with `@diffspot/vue`.
    - Replace diff composable imports with `@diffspot/vue`.
    - Import `@diffspot/vue/theme.css` (or keep local theme since diffspot has its own design system).
    - Remove extracted source files from `app/`.
    - Verify everything works end-to-end.

---

## Repo structure

Recommended: convert diffspot into a **monorepo** using npm/pnpm workspaces.

```
diffspot/
├── packages/
│   ├── core/                     # @diffspot/core
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   ├── compute.ts
│   │   │   ├── minimap.ts
│   │   │   ├── navigation.ts
│   │   │   └── worker.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── vue/                      # @diffspot/vue
│       ├── src/
│       │   ├── index.ts
│       │   ├── theme.css
│       │   ├── components/
│       │   │   ├── DiffView.vue
│       │   │   ├── DiffSplitView.vue
│       │   │   ├── DiffUnifiedView.vue
│       │   │   ├── DiffLine.vue
│       │   │   ├── DiffGutter.vue
│       │   │   ├── DiffMinimap.vue
│       │   │   ├── DiffControls.vue
│       │   │   └── DiffStats.vue
│       │   └── composables/
│       │       ├── useDiff.ts
│       │       ├── useDiffOptions.ts
│       │       ├── useDiffNavigation.ts
│       │       ├── useVirtualScroll.ts
│       │       └── useExport.ts
│       ├── tests/
│       ├── package.json
│       └── tsconfig.json
├── app/                          # diffspot web app (consumes both packages)
├── server/
├── nuxt.config.ts
├── package.json                  # workspace root
└── pnpm-workspace.yaml
```

### Workspace config

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

Root `package.json` scripts:
```json
{
  "scripts": {
    "build:core": "pnpm --filter @diffspot/core build",
    "build:vue": "pnpm --filter @diffspot/vue build",
    "build:packages": "pnpm build:core && pnpm build:vue",
    "test:packages": "pnpm --filter './packages/*' test",
    "dev": "nuxt dev"
  }
}
```

---

## Publishing checklist

- [ ] Choose npm scope (reserve `@diffspot` on npm)
- [ ] Add `LICENSE` file (MIT recommended) to each package
- [ ] Add `CHANGELOG.md` to each package
- [ ] Configure `files` field in `package.json` to only ship `dist/`
- [ ] Verify `exports` map works with both ESM and CJS consumers
- [ ] Test in a clean Vue 3 project (not the monorepo) before publishing
- [ ] Set up CI: lint, typecheck, test, build for both packages
- [ ] Consider `changesets` or `release-it` for version management
- [ ] Publish `@diffspot/core` first, then `@diffspot/vue`
