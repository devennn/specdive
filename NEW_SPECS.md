# Specdive — Project Plan

AI-native project management layer that lives inside the codebase. AI coding
assistants (Cursor, opencode) read and write project specs
via MCP as they work. A local webpage gives project managers a simple, live
view of what's built and what's still in progress — no git dependency, no
manual status updates.

---

## 1. Core Concept

Traditional project trackers (Jira, GitHub Projects, Linear) sit outside the
codebase and require humans to manually keep them in sync with what's
actually happening in code. Specdive flips this: the AI coding assistant
_is_ the one updating status, because it's the one doing the work. The human
(PM) just views the result.

**Key design principles established during planning:**

- **AI-first, not scan-first.** No deterministic heuristics/scanning logic
  in specdive itself. The AI assistant reads the codebase and FEATURES.md
  using its own native file tools and reasons about structure — specdive
  only exposes tools for _writing_ spec state.
- **Git-free.** No branch resolution, no commit history import, no git
  dependency anywhere in the flow (including on existing/legacy projects).
  Kept deliberately simple and consistent — one code path, always works.
- **Feature-level granularity.** One spec = one feature a PM would
  recognize, never one spec per source file. Specs link to real files via
  `source_files`, not the other way around.
- **Plain text as source of truth.** Specs are markdown files with YAML
  frontmatter — diffable, greppable, mergeable in PRs, language-agnostic
  (matters since the codebase is polyglot).
- **Honest data, not fabricated history.** Specs created from existing code
  get a single `(backfilled)` log entry, never an invented timeline.

---

## 2. Folder Structure (`specdive init`)

```
.specdive/
  config.yml              # project-wide settings
  INSTRUCTIONS.md          # behavior contract for AI assistants (see §5)
  specs/
    FEAT-001-user-auth.md
    FEAT-002-oauth-login.md
    FEAT-003-dashboard.md
  state.json                # derived index, rebuilt from specs
```

- `state.json` is a disposable cache — rebuilt on file change via a
  watcher, not a source of truth. specdive never writes `.gitignore`;
  whether to ignore `state.json`, `cache/`, or the host MCP config is
  the user's choice.
- `config.yml` holds optional settings. `project` is the human-readable
  name shown in the PM view header as `{project} Specs`. If unset, the
  view falls back to the working directory name. User data (`config.yml`,
  specs) is never overwritten: `init` refuses if `.specdive/` already
  exists; `update` refreshes only specdive-owned `INSTRUCTIONS.md` and
  missing `AGENTS.md` blocks.

---

## 3. Spec File Schema

One markdown file per feature. YAML frontmatter for structured data, prose
sections for everything else.

```yaml
---
id: FEAT-002
title: OAuth login flow
status: backlog            # done | backlog
source_files:
  - src/auth/oauth.ts
  - src/auth/callback-handler.ts
  - src/middleware/session.ts
depends_on: [FEAT-001]
commits:
  - sha: a1b2c3d4e5f6789012345678901234567890abcd
    message: Add oauth callback validation
updated_by: opencode
updated_at: 2026-08-13T10:22:00Z
---

## Summary
One or two sentences. Plain language, PM-readable.

## Capabilities
What it can currently do — observed from the code, not aspirational.
- Users can log in via Google or GitHub
- Session persists across page reloads via httpOnly cookie
- Falls back to email/password if OAuth fails

## Known Issues
Real problems observed while reading the code, not hypothetical.
- No rate limiting on the callback endpoint

## Security Notes
Anything touching auth, secrets, user data, external calls, permissions.
- OAuth client secret read from env var, not committed — good
- No CSRF state param validation on callback — flag for review

## Open Questions
Things the AI was unsure about — signal for a human to resolve.
- Is token refresh supposed to happen client-side or server-side?

## Progress Log
- 2026-08-13 (backfilled): Spec created from existing code. Feature
  appears functional based on reading oauth.ts and callback-handler.ts.
  Log starts tracking from today.
- 2026-08-13: wired callback handler, testing token refresh
```

### Section order rationale

Summary and Capabilities first (PM-relevant). Known Issues / Security Notes
next, visually flagged in the UI. Open Questions and Files further down
(dev-relevant). Progress Log last — it's the audit trail, least useful for
a quick skim.

### Backfill rule (existing codebases)

- Every spec created from pre-existing code gets **exactly one** entry
  prefixed `(backfilled)`, summarizing current observed state.
- Never invent past dates, commit references, or a fabricated timeline.
- All entries after the backfill are real, timestamped as they happen.
- No git-log import, even as an opt-in — deliberately excluded to keep the
  tool fully git-free and consistent.

### Commit tagging

Frontmatter `commits` is an append-only list of `{ sha, message }` written
by `specdive_tag_commit`. The host assistant supplies the SHA after it
creates a git commit — specdive never runs git. One commit may be tagged
onto multiple specs when the diff spans features. Re-tagging the same SHA
onto the same spec is a no-op. Missing `commits` on older specs parses as
`[]`.

---

## 4. MCP Tool Surface

Write-side only. The host assistant (Cursor/opencode) already
has native file-read tools, so specdive doesn't duplicate read access.
`specdive_health` is the one non-write tool: a ping so the assistant
can confirm the server is reachable.

| Tool                                                                         | Purpose                                                          |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `specdive_health()`                                                          | Ping: returns ok, name, version, initialized, specdiveDir        |
| `specdive_init()`                                                            | Scaffolds `.specdive/` (fails if it already exists)              |
| `specdive_update()`                                                          | Refreshes `INSTRUCTIONS.md` + missing `AGENTS.md` blocks         |
| `specdive_create_spec({title, status, content, source_files?, depends_on?})` | Writes one spec `.md` file, returns its id                       |
| `specdive_update_status(id, status)`                                         | Updates frontmatter status                                       |
| `specdive_log_progress(id, note)`                                            | Appends a timestamped entry to Progress Log                      |
| `specdive_tag_commit({sha, message, ids})`                                   | Tags one git commit onto one or more specs                       |
| `specdive_list_specs(filter?)`                                               | Returns specs, filterable by status                              |

No `specdive_read_file`, no branch resolution, no git shell-outs. The
assistant runs git; specdive only stores the SHA the assistant passes.

---

## 5. Instructions Resource (behavior contract for AI assistants)

Returned directly by `specdive_init` / `specdive_update` and written to
`.specdive/INSTRUCTIONS.md` so the assistant has it in context immediately.

```markdown
# Specdive instructions for AI assistants

- Specdive is the primary specs management system for this repo.
  Any open question, reference, discussion, or progress update
  belongs on the relevant spec — do not leave it only in chat.
  Call specdive_log_progress for progress; put questions,
  references, and discussion outcomes into the spec sections
  (Open Questions, Summary, Known Issues, source_files).
  Don't ask the user to do this manually.

- "Initialize specdive for this codebase" →
  Explore the repo yourself. Identify features/modules at a level a
  product manager would recognize (not individual files or functions).
  For each feature, call specdive_create_spec with title, a short goal
  description, best-guess status, and source_files listing the real
  files that implement it.

- "Read FEATURES.md to create spec" →
  Read FEATURES.md yourself. Each feature/section becomes one spec.
  Cross-reference the codebase to fill in source_files — don't just
  copy the feature list without checking what actually exists.

- One spec = one feature. Never create a spec per individual file.

- When creating a spec for a feature that already exists in the
  codebase (not new work about to start):
  Write exactly one progress log entry, prefixed "(backfilled)",
  summarizing what you observed by reading the code — not a guess at
  history, just the current state.
  Never invent past dates, commit references, or a fabricated timeline.

- Ongoing work: when you finish or start a meaningful chunk of work on
  a feature, call specdive_update_status and specdive_log_progress.
  Don't ask the user to do this manually.

- After every git commit you create, call specdive_tag_commit with the
  new SHA, the commit subject, and every FEAT-NNN spec the commit
  touches. One commit may tag multiple specs. Do this as part of the
  commit — don't ask the user. specdive does not run git; you pass the
  SHA you just created.

- `.specdive/` already exists and you need the current INSTRUCTIONS →
  call specdive_update. Do not call specdive_init (it will fail).

Status values: done | backlog

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

If the host AGENTS.md contains a `<!-- specdive:status-rule -->` block, follow that over this default.
```

### Host agent file (`init` / `install` / `update`)

CLI `specdive init --target`, `specdive install --target`, and
`specdive update` insert marked blocks into the host coding-agent
instruction file so they are in session context without an MCP call
(Cursor, OpenCode → `AGENTS.md`):

1. Spec Status Decision Rule — `<!-- specdive:status-rule -->`
2. Commit tagging — `<!-- specdive:commit-tag -->` (call
   `specdive_tag_commit` after every git commit the agent creates)

Each block is insert-if-missing — a user-edited block is never
overwritten. The file is committed (not gitignored). This is a sanctioned
write outside `.specdive/`, alongside the host MCP config.

MCP `specdive_init` has no provider, so it only scaffolds `.specdive/`
(and fails if it already exists). `specdive_update` refreshes
`INSTRUCTIONS.md` and injects missing `AGENTS.md` blocks — it does not
touch `config.yml` or specs.

---

## 6. CLI Surface

Minimal — setup and serving only, no analysis logic (that's the AI's job).

```
specdive init [--target cursor|opencode]                 # create .specdive/; refuse if it exists
specdive update                                          # refresh INSTRUCTIONS.md + missing AGENTS.md blocks
specdive install --target cursor|opencode               # wires MCP config + AGENTS.md blocks
specdive view                                            # opens webpage
```

**Open item:** `specdive install` needs to handle each target's MCP config
format/location individually (Cursor and opencode expect slightly
different config shapes) — flagged as the fiddliest part of the build.

---

## 7. Webpage (`specdive view`)

Local server (e.g. `localhost:4747`), opens in browser. Built for a PM
audience — no terminal literacy required.

The header shows the specdive icon and `{project} Specs`. A matching
favicon is served at `/favicon.svg` (and `/favicon.ico`).

### List view (default)

Sidebar tabs — **Done** first (the default), **Backlog** second. One list
visible at a time. Within each tab, specs are sorted latest-first (highest
id at the top — ids are assigned in creation order). No status text badges.

```
Done (4)  |  Backlog (2)
  ○ User authentication (email/password)
  ○ Dashboard layout
  ○ File upload
  ○ Basic search
```

- Deliberately no warning/security indicators in the list — kept bare on
  purpose. Issues and security notes are one click away, not surfaced here.
Opening a spec from the other group (e.g. a dependency link) switches
the tab so the selected item is visible. The selected spec and list tab
are reflected in the URL (`?tab=done|backlog&id=FEAT-NNN`) so a refresh
or shared link restores the same view. In-page outline links use the
URL hash (`#known-issues`).

### Detail panel (on click)

Side panel (list stays visible), shows full spec content in PM-first order:
Summary → Capabilities → Known Issues (flagged) → Security Notes (flagged)
→ Open Questions → Files → Commits → Progress Log.

Prose is rendered as HTML in a constrained reading column, like a docs
page — headings and spacing, not nested cards. Summary is the lead
paragraph (no section label). Known Issues and Security Notes are the
only callouts. Progress Log is a dated list. `source_files` are listed
as paths; `depends_on` are links that jump to that spec; `commits` are
short SHA + subject (newest first). Timestamps are
human-readable.

The article follows a docs-site layout: breadcrumb (Done/Backlog › title),
large title, then a meta row (id pill, date, author) and headed
sections. A right-hand **On this page**
outline stays sticky while the page scrolls and jumps to the chosen heading.

### Mind map view (toggle)

Dependency graph built from `depends_on`, nodes colored by status. For
"what's blocking what" conversations.

### Live updates

File watcher (`chokidar`) on `.specdive/specs/*.md` + WebSocket or polling
to `/api/specs`, so the PM sees the AI's updates without refreshing.

---

## 8. Suggested Tech Stack (TypeScript)

| Layer               | Tool                           |
| ------------------- | ------------------------------ |
| CLI                 | `commander` or `oclif`         |
| MCP server          | `@modelcontextprotocol/sdk`    |
| Frontmatter parsing | `gray-matter`                  |
| Local server        | `express` or `fastify`         |
| Frontend            | React (or lightweight HTML/JS) |
| Mind map render     | `react-flow` (interactive)     |
| File watching       | `chokidar`                     |

---

## 9. Open Decisions / Next Steps

- [ ] Decide install-time MCP config handling per target (Cursor, opencode
      config shapes differ)
- [ ] Build `specdive_create_spec` implementation (frontmatter write +
      validation)
- [ ] Build `specdive_init` scaffold + instructions resource
- [ ] Build webpage: list view (Done / Backlog) + detail panel
- [ ] Build mind map view
- [ ] Build live-reload (file watcher + API)
- [ ] Consider a `Confidence` field (`high | medium | low`) in frontmatter
      alongside `status`, to signal how thoroughly the AI traced a feature
      before labeling it — raised but not yet decided
- [x] When a user commits via an AI agent, the agent tags the commit onto
      affected specs via `specdive_tag_commit` (one commit may span
      multiple features). Instruction-only: `INSTRUCTIONS.md` plus a
      marked `AGENTS.md` block so Cursor/OpenCode always have it in
      session context. specdive stays git-free — the agent supplies the
      SHA; no git-log import, no host hook.

---

## 10. Decisions Log (from planning conversation)

| Decision                       | Outcome                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Sync mechanism                 | Git-free entirely — no branch tracking, no commit import                                                      |
| View format                    | Webpage, not TUI — built for PM audience                                                                      |
| Spec granularity               | One spec per feature, not per file                                                                            |
| Existing-project bootstrap     | AI-driven via natural language ("Initialize specdive", "Read FEATURES.md"), not a deterministic `--scan` flag |
| Progress log for existing code | Single `(backfilled)` entry, no fabricated history, no git-log import even as opt-in                          |
| List view warnings             | Excluded — list stays bare, issues/security only in detail panel                                              |
| Spec status                    | Two values only: `done` and `backlog`. PM view groups by those; no status text badge in list or detail. Legacy `todo`/`in_progress`/`blocked` coerce to `backlog` on read/write. |
| Host agent files               | Second sanctioned write outside `.specdive/`: marked blocks in `AGENTS.md` (Cursor, OpenCode) — status-rule and commit-tag — insert-if-missing only. Committed, not gitignored |
| Commit tagging                 | Frontmatter `commits: [{sha, message}]`. MCP `specdive_tag_commit({sha, message, ids})` tags one SHA onto one or more specs. Agent runs git and passes the SHA; specdive never shells out to git. Re-tag same SHA on same spec is a no-op. |
| Init vs update                 | `init` / `specdive_init` create `.specdive/` and refuse if it exists. `update` / `specdive_update` refresh specdive-owned `INSTRUCTIONS.md` and missing `AGENTS.md` blocks; never touch `config.yml` or specs. |
| Gitignore                      | specdive never writes `.gitignore`. Specs, config, host MCP files, and derived cache are the user's to ignore or commit. |
