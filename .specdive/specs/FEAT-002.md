---
id: FEAT-002
title: Spec write operations & .specdive/ trust boundary
status: done
source_files:
  - src/io/write-guard.ts
  - src/io/atomic-write.ts
  - src/io/paths.ts
  - src/specs/write.ts
  - src/specs/progress-log.ts
  - src/specs/tag-commit.ts
  - src/specs/state.ts
depends_on:
  - FEAT-001
commits:
  - sha: 32dbf00b17e7e52aaef0d84cd37669661575d84b
    message: Initial commit of specdive.
updated_by: cursor
updated_at: '2026-08-18T02:40:24.539Z'
---
## Summary
The mutation path for spec state — `create`, `update_status`,
`log_progress`, `tag_commit` — plus the `.specdive/` boundary
enforcement that every write must pass, atomic temp-then-rename writes,
and the disposable `state.json` cache rebuilt on every change.

## Capabilities
- `createSpec` assigns the next `FEAT-NNN` id, validates inputs, writes the
  markdown atomically, and rebuilds `state.json`.
- `updateStatus` rewrites a spec's status and stamps `updated_at` /
  `updated_by`.
- `logProgress` appends a `- YYYY-MM-DD: note` line to the
  `## Progress Log` section (creating it if absent), preserving the rest of
  the body verbatim.
- `tagCommit` appends `{ sha, message }` to one or more specs' frontmatter
  `commits` (same SHA on many specs; re-tag is a no-op). Validates every
  id exists before writing any file.
- The write guard resolves every target relative to a bound `.specdive/`
  dir and refuses anything that escapes via `..` or an absolute path; it
  also refuses protected root files (`.env`, `.env.example`).
- All writes use a same-directory hidden temp file + rename (atomic on
  POSIX); JSON is serialized with sorted keys and a trailing newline.
- `state.json` is a derived cache fully overwritten from specs on every
  change (`rebuildState` / `loadState`).

## Known Issues
- Progress-log section detection keys off an exact `## Progress Log`
  header; a differently-cased or ATX-variant header (e.g. a double space)
  would be treated as a new section rather than appended into.

## Security Notes
- The write guard is the trust-model chokepoint: no code path writes
  outside `.specdive/`. It is critical and explicitly tested. `.env*` are
  hard-excluded. Any new write site must go through `guard.assertWritable`
  — never bypass it.

## Open Questions
- Should `rebuildState` debounce coalesced writes, or is a full rebuild on
  every mutation acceptable at expected spec counts?

## Progress Log
- 2026-08-13 (backfilled): Write guard, atomic writes, paths,
  create/update/log, progress-log, and state rebuild are complete;
  write-guard, state, and status tests pass. No TODOs.
- 2026-08-17: `tagCommit` writes a git SHA onto one or more specs
  without running git.
