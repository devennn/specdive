# AGENTS.md — specdive

## Prime directive

specdive is **write-side only** and **git-free**. It exposes MCP tools that
let an AI coding assistant write spec state into `.specdive/`; it does not
scan the codebase, call LLMs, or shell out to git. No code path writes
spec state outside `.specdive/`. This is the product's trust model — never
weaken it, never add "small" exceptions.

- **AI-first, not scan-first.** No deterministic heuristics or scanning
  logic in specdive itself. The AI assistant reads the codebase with its
  own native file tools and reasons about structure — specdive only
  exposes tools for *writing* spec state.
- **Git-free.** No branch resolution, no commit-history import, no git
  dependency anywhere. One code path, always works.
- **Feature-level granularity.** One spec = one feature a PM would
  recognize, never one spec per source file.
- **Plain text as source of truth.** Specs are markdown files with YAML
  frontmatter — diffable, greppable, mergeable in PRs.
- **Honest data, not fabricated history.** Specs created from existing
  code get a single `(backfilled)` log entry, never an invented timeline.

## Core principles

### 1. Single responsibility

- Each file does one thing
- Each function has one clear purpose
- Split files beyond ~150 lines

### 2. Strict typing

- Do not use `any` — strict TypeScript types only. No implicit `any`, no
  explicit `any`, no `any[]`, no `Record<string, any>`, no `as any`, no
  `Promise<any>`. Define an explicit type instead. `noImplicitAny: true` is
  set in `tsconfig.json`; explicit `any` is banned by review and there must
  be zero occurrences in `src/`.
- No `unknown` without narrowing
- No `Record<string, unknown>` — define explicit shapes
- Explicit return types and parameter types everywhere

### 3. Simplicity first

- Plain TypeScript; avoid frameworks unless required
- Minimal dependencies (see Dependencies below for the approved set)
- No premature optimization, no DI, no factories

### 4. Readability over cleverness

- Understandable in under 30 seconds
- Max 2 nesting levels
- Descriptive names

## Naming

- Files: kebab-case (`create-spec.ts`)
- Functions/variables: camelCase, descriptive
- Types/interfaces: PascalCase

## UI help copy

In the view SPA, do **not** leave instructional prose always visible (hints
under headings, persistent tip banners). Put that copy behind a clickable
`i` control (`.info-tip`) with:

- `title` / `aria-label` for hover accessibility
- a clickable popover (`.info-tip-pop`) so touch users can open it too

The **empty state** (no specs yet) is the one exception: it shows onboarding
steps inline, since there's nothing else to display and the user needs to
know what to do next. Once specs exist, hide the prose and use `i` tips.

Reuse the shared `infoTip()` / `toggleInfoTip()` pattern in the view scripts.
Help-dialog long-form docs are fine; inline UI chrome should use `i` tips.

## Function design

- 30–40 lines max
- 3 parameters max, then use an options object
- No hidden side effects

## Comments

Code is read more often than it is written. Comments orient the next reader
fast — including future you.

- **Comment functions, not files.** No file-top header comments; put
  documentation on the functions themselves.
- **Comment the *why*, not the *what*.** If the code already says it clearly,
  don't restate it in prose.
- **Explain non-obvious logic**: algorithms, workarounds, ordering
  constraints, "looks wrong but is intentional" cases.
- **JSDoc on exported functions** whose contract, parameters, or return value
  aren't obvious from the signature and name.
- **No dead comments.** Delete comments that contradict the code; update them
  when the code changes.
- **No noise.** `// increment i` is worse than no comment.

## Error handling

- Never fail silently
- Known errors: clear, actionable messages
- Catch-alls log exactly `Unexpected error` + the message
- Exit codes: `0` success, `1` unexpected error, `2` usage/config error,
  `3` port in use

## Logging

MCP tool calls and CLI commands prefix every line with `[specdive]`.

```ts
console.log("[specdive] spec created: FEAT-003 dashboard");
console.error("[specdive] Unexpected error", err instanceof Error ? err.message : String(err));
```

MCP tool handlers return structured errors to the host assistant, not just
log them — the assistant must be able to react to a failed write.

## Filesystem rules

- All state writes go through one module that enforces the `.specdive/`
  boundary (the write guard). Everything else is read-only.
- Spec files are plain markdown + YAML frontmatter, meant to be committed.
- `state.json` is a disposable derived cache — rebuilt from specs on change,
  never a source of truth. specdive does not write `.gitignore`.
- JSON output: sorted keys, 2-space indent, trailing newline.
- Mutations are atomic: write temp file, rename.
- The sanctioned writes outside `.specdive/` are:
  1. the host MCP config (`opencode.json` / `.cursor/mcp.json`)
     written by `specdive init` / `specdive install` — always
     a **local** (stdio) server entry, never a remote/url one. specdive
     does not add that file to `.gitignore`; the user decides whether to
     commit it.
  2. marked blocks in `AGENTS.md` (Cursor, OpenCode), inserted only if
     absent so user edits persist: `<!-- specdive:status-rule -->`,
     `<!-- specdive:commit-tag -->`, and `<!-- specdive:pm-sync -->`.
     This file is committed, not gitignored.

## Spec writing rules

- **One spec = one feature.** Never create a spec per individual file.
- IDs are `FEAT-NNN`, zero-padded, assigned in creation order.
- Status values: `done | backlog`. Apply the Spec
  Status Decision Rule below.
- Backfill rule: a spec created from pre-existing code gets exactly one
  Progress Log entry prefixed `(backfilled)`, summarizing observed current
  state. Never invent past dates, commit references, or a fabricated
  timeline. No git-log import, ever, even as opt-in.
- `source_files` lists real files that implement the feature — the AI
  cross-references the codebase to fill these in, never guesses blindly.
- Frontmatter is structured data; prose sections (Summary, Capabilities,
  Known Issues, Security Notes, Open Questions, Progress Log) are
  PM-readable plain language.

<!-- specdive:status-rule -->
## Spec Status Decision Rule

Question: Does the feature work for a user in normal operation?

**done** — the shipped capabilities are built, integrated, and functional. Known Issues are one of:
- Hardening / robustness (no retry, no stale-lease recovery)
- Scalability (no virtualization, no caching)
- Enhancement / open question (no export, no streaming)
- Inherent integration fragility (session expiry, scraping breakage)
- Validation / consistency gaps (permission drift, no calibration)

Track these as Known Issues, not a reason to stay out of done.

**backlog** — the feature breaks under normal conditions:
- A routine event (token expiry, transient send failure) causes permanent failure
- A core capability is missing, not just rough
- Manual intervention is required to keep it working

Log the specific gap in the Progress Log.

The line: Polish/enhancement = Known Issues → done. Breaks-in-normal-use → backlog.

Edit this block to change how this project decides status. Re-install will not overwrite it.
<!-- /specdive:status-rule -->

<!-- specdive:commit-tag -->
## Specdive commit tagging

After every git commit you create in this repo, call `specdive_tag_commit`
with the new SHA, the commit subject, and every `FEAT-NNN` spec the
commit touches. One commit may tag multiple specs when the diff spans
features.

Do this as part of committing — don't ask the user, don't skip it.
Use `specdive_list_specs` and the diff to pick ids. specdive does not
run git; you pass the SHA you just created.

Edit this block to change how this project tags commits. Re-install will not overwrite it.
<!-- /specdive:commit-tag -->

<!-- specdive:pm-sync -->
## Specdive project-management sync

When you start or complete work on a spec (call `specdive_update_status`
and `specdive_log_progress`), also update the matching task in the
user's other project-management software (ClickUp, Linear, Jira, GitHub
Issues, or similar) if a connector is already available in this session
— an MCP server, CLI, or other tool the host has connected.

If no such tool is connected, or you cannot find a matching task,
proceed with the specdive write and do not ask the user to connect a
tracker. Do not fail the task because the tracker update failed.
specdive does not talk to those tools; you do.

Edit this block to change how this project syncs with other trackers. Re-install will not overwrite it.
<!-- /specdive:pm-sync -->

## MCP rules

- specdive's MCP surface is **write-side only** (plus a reachability
 ping): `specdive_health`, `specdive_init`, `specdive_update`,
 `specdive_create_spec`, `specdive_update_status`, `specdive_log_progress`,
 `specdive_tag_commit`, `specdive_list_specs`.
 No `specdive_read_file` — the host assistant reads code with its own
 native file tools. `specdive_health` returns ok, version, and whether
 `.specdive/` is initialized — it does not read the codebase.
- Every tool validates its inputs (id format, status enum, required
  fields) before writing.
- `specdive_init` creates `.specdive/` and fails if it already exists.
  `specdive_update` refreshes `INSTRUCTIONS.md` and injects missing
  `AGENTS.md` blocks; it does not touch `config.yml` or specs.
- Secrets (`.env*`) are hard-excluded from any tool context and never
  written by specdive.

## Dependencies

- Minimal; prefer Node built-ins
- Approved set: `commander`, `gray-matter`, `express`,
  `chokidar`, `@modelcontextprotocol/sdk`
- Frontend is lightweight HTML/JS + inline SVG (no React, no bundler) to
  keep the build as a single `tsc` step
- New dependencies need a spec update justifying them

## Git

- Run the full build before committing; fix all errors first
- Never commit secrets; `.env` files are gitignored by design
- `.specdive/state.json` and `.specdive/cache/` are derived, not source of
  truth. This repo ignores them; specdive does not write `.gitignore` for
  consumers.

## Build commands

- **Typecheck:** `npx tsc --noEmit`
- **Build:** `npx tsc -p tsconfig.build.json`
- **Test:** `node --test --import tsx tests/*.test.ts`
- **Run (dev):** `npx tsx src/index.ts <command>`
- **Run (built):** `./dist/index.js <command>`
- **Run MCP server (dev):** `npx tsx src/index.ts mcp`
- **Run MCP server (built):** `./dist/index.js mcp`

## Testing

- Frontmatter round-trip (write → read → identical) is tested explicitly
- ID assignment and next-id logic are tested
- The write guard (`.specdive/` boundary enforcement) is critical — test it
- `state.json` rebuild from specs is tested
- Status enum validation is tested
- Do not over-test trivial scripts
