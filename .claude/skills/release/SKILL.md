---
name: release
description: Cut a new release — runs verification, bumps versions if needed, commits, pushes, tags, publishes packages, and creates a GitHub release
disable-model-invocation: true
argument-hint: "[version-number]"
---

# Release Workflow

Cut release version `$ARGUMENTS` for diffspot.

## Steps

Execute these in exact order. Stop and report if any step fails.

### 1. Verification checklist

Run all four commands. Every one must pass.

```bash
pnpm test:packages
pnpm lint
pnpm typecheck
pnpm build
```

### 2. Check for package changes

Compare `packages/core/src/` and `packages/vue/src/` against the latest git tag:

```bash
git diff $(git describe --tags --abbrev=0) -- packages/core/src/ packages/vue/src/
```

- If `@diffspot/core` source changed → bump its version in `packages/core/package.json`
- If `@diffspot/vue` source changed → bump its version in `packages/vue/package.json`
- If the core peer dep range in `packages/vue/package.json` no longer covers the new core version → update it
- If neither package changed, skip version bumps and npm publishing later

### 3. Commit

Stage version bumps (if any) and any remaining release-ready changes.

Write the commit message to `.git/COMMIT_MSG_TEMP` using the Write tool, then commit with `git commit -F .git/COMMIT_MSG_TEMP`. Never use heredocs for commit messages.

Commit message format:
```
Prepare v$ARGUMENTS release

<one-line summary of what changed since last release>

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

If there are no staged changes (docs-only release with nothing new to commit), skip the commit.

### 4. Push main

```bash
git push origin main
```

### 5. Tag and push tag

```bash
git tag v$ARGUMENTS
git push origin v$ARGUMENTS
```

### 6. Publish npm packages (if packages changed)

Only if step 2 found source changes. Build first, then publish:

```bash
pnpm --filter '@diffspot/core' build
cd /path/to/packages/core && npm publish --access public

pnpm --filter '@diffspot/vue' build
cd /path/to/packages/vue && npm publish --access public
```

If publish fails after the tag exists, do NOT retry with the same version. Fix forward with a new version number.

### 7. Create GitHub release

Generate release notes from commits since the previous tag:

```bash
git log $(git describe --tags --abbrev=0 v$ARGUMENTS^)..v$ARGUMENTS --oneline
```

Create the release:

```bash
gh release create v$ARGUMENTS --title "v$ARGUMENTS" --latest --notes "<notes>"
```

Use category headers like `## Summary`, `### Features`, `### Fixes`, `### Docs`, `### Packages` as appropriate.

## Final report

After all steps complete, summarize:
- Commit hash
- Tag name
- Packages published (with versions) or "skipped"
- GitHub release URL
