# specdive

Project management that lives inside your codebase. Your AI coding
assistant writes feature specs as it works — via MCP — and a local webpage
gives your PM a live view of what's built and what's in progress.

The AI is the one updating status, because it's the one doing the work. The
PM just watches.

> **Status: built.** `NEW_SPECS.md` is the source of truth; this repo
> implements it.

## How it works

- **AI-first.** specdive exposes MCP *write* tools. The AI assistant reads
  the codebase with its own file tools and reasons about structure.
- **Git-free.** One code path, always works.
- **Feature-level granularity.** One spec = one feature a PM would
  recognize.
- **Plain text as source of truth.** Specs are markdown + YAML frontmatter —
  diffable, greppable, mergeable in PRs.
- **Honest data.** Specs created from existing code get a single
  `(backfilled)` log entry, never an invented timeline.

## Getting started

specdive has three roles: the **developer** sets it up once, the **AI
assistant** writes spec state as it works, and the **PM** opens the
webpage to watch progress.

### 1. Install specdive

See [CONTRIBUTING.md](CONTRIBUTING.md) to build specdive from source. Once
`specdive` is on your `PATH`, continue here.

### 2. Scaffold specdive (and wire the MCP server)

From the root of the repo you want to track:

```bash
specdive init
```

This creates `.specdive/` and prompts you to pick an AI assistant to wire
the specdive MCP server into (cursor / opencode). If `.specdive/` already
exists, `init` refuses — use `specdive update` to refresh instructions
without touching specs or `config.yml`. To skip the prompt, pass the
target:

```bash
specdive init --target opencode     # create + install MCP in one step
specdive update                     # refresh INSTRUCTIONS.md + missing AGENTS.md blocks
```

If you only want to wire the MCP server (no scaffolding), use `install`:

```bash
specdive install --target opencode   # or cursor
```

`install`/`init` always write a **local** (stdio) MCP config — the host
launches `specdive mcp` as a subprocess. specdive does not add that file
to `.gitignore`; you decide whether to commit it. Override the launch
command with the `SPECDIVE_CMD` env var (e.g.
`SPECDIVE_CMD="node /path/to/dist/index.js mcp"`).

Re-running `install` is safe and idempotent: it **merges** into your
existing config — other MCP servers and top-level keys are preserved, and
your customizations on the `specdive` entry (env vars, `enabled`, `timeout`)
are kept. Only the launch command is forced back to current.

`init`/`install`/`update` insert marked blocks into `AGENTS.md` if they are
not already there: the Spec Status Decision Rule, and a commit-tagging
instruction so the assistant calls `specdive_tag_commit` after every git
commit. Edit either block to change the project's behavior; re-install
will not overwrite them.

### 3. Open the PM view

```bash
specdive view          # http://127.0.0.1:4747 (prints the URL; does not auto-open)
```

With no specs yet, the page shows an onboarding empty state: install the MCP
server (if you skipped it), then ask your AI assistant to create specs.

### 4. Ask the assistant to create specs

Open your AI assistant (Cursor/opencode) in that repo and say
something like:

> Initialize specdive for this codebase. Explore the repo, identify features
> at the level a PM would recognize, and call `specdive_create_spec` for
> each one with a short summary, best-guess status, and `source_files`
> listing the real files that implement it.

The assistant calls `specdive_init` if `.specdive/` is missing, or
`specdive_update` to refresh INSTRUCTIONS, then `specdive_create_spec` per
feature. Specs created from existing code get one `(backfilled)` Progress
Log entry — no invented history.

### 5. Ongoing usage

As the assistant works on a feature, it calls `specdive_update_status` and
`specdive_log_progress` itself — you don't update anything by hand. After
every git commit it creates, it calls `specdive_tag_commit` with the SHA
and every spec the commit touches. The PM just keeps the `specdive view`
page open; it updates live (file watcher + SSE).

```bash
# Later — add a new feature spec:
> Create a spec for the new export-to-CSV feature. status: backlog.

# Or from a FEATURES.md:
> Read FEATURES.md and create a spec for each section, cross-referencing the
> codebase for source_files.
```

### Environment variables

| Var | Default | Purpose |
| --- | --- | --- |
| `SPECDIVE_CMD` | `npx specdive mcp` | Launch command `init`/`install` writes into the host config |
| `SPECDIVE_UPDATED_BY` | `mcp` | Recorded as `updated_by` in spec frontmatter |

## CLI reference

```
specdive init [--target <cursor|opencode>]  # create .specdive/ + wire MCP (refuses if exists)
specdive update                             # refresh INSTRUCTIONS.md + missing AGENTS.md blocks
specdive install --target <cursor|opencode> # wire the MCP server only (local/stdio)
specdive view [--port <4747>] [--host <127.0.0.1>]     # PM webpage (prints URL)
specdive mcp                                            # run the MCP server (stdio)
```

`init` creates `.specdive/` and wires the MCP server — prompting for a
target if `--target` is not given. It refuses if `.specdive/` already
exists. `update` refreshes `INSTRUCTIONS.md` and injects missing
`AGENTS.md` blocks; it does not touch `config.yml` or specs. `install`
wires the MCP server only (no scaffolding) and is idempotent (merges into
an existing config — see above). `init`/`install`/`update` insert marked
blocks into `AGENTS.md` if they are not already there — the Spec Status
Decision Rule (`done` vs `backlog`) and the commit-tagging instruction.
`view` prints the URL and stays running until killed — it does not open a
browser.

## `.specdive/` layout

```
.specdive/
  config.yml              # project-wide settings (optional)
  INSTRUCTIONS.md         # behavior contract the AI assistant reads
  specs/
    FEAT-001.md           # one markdown file per feature (committed)
    FEAT-002.md
  state.json               # derived index, rebuilt on change
```

Spec files are the source of truth and meant to be committed. `state.json`
is a disposable derived cache, rebuilt from specs on every change — never
a source of truth. specdive does not write `.gitignore`.

## MCP tools (write-side only)

| Tool | Purpose |
| --- | --- |
| `specdive_health()` | Ping: returns ok, name, version, initialized, specdiveDir |
| `specdive_init()` | Create `.specdive/`, return INSTRUCTIONS (fails if it exists) |
| `specdive_update()` | Refresh INSTRUCTIONS.md + missing AGENTS.md blocks |
| `specdive_create_spec({title, status, content, source_files?, depends_on?})` | Write one spec `.md`, return its `FEAT-NNN` id |
| `specdive_update_status(id, status)` | Update frontmatter status |
| `specdive_log_progress(id, note)` | Append a timestamped entry to Progress Log |
| `specdive_tag_commit({sha, message, ids})` | Tag one git commit onto one or more specs |
| `specdive_list_specs(filter?)` | List specs, filterable by status |

Status values: `done | backlog`. Polish/enhancement → `done`; breaks in
normal use → `backlog`. Default rule is in `.specdive/INSTRUCTIONS.md`; a
host `AGENTS.md` block, if present, takes precedence.

## Spec file format

One markdown file per feature under `.specdive/specs/FEAT-NNN.md`:

```yaml
---
id: FEAT-002
title: OAuth login flow
status: backlog
source_files:
  - src/auth/oauth.ts
depends_on: [FEAT-001]
commits:
  - sha: a1b2c3d4e5f6789012345678901234567890abcd
    message: Add oauth callback validation
updated_by: opencode
updated_at: 2026-08-13T10:22:00Z
---

## Summary
## Capabilities
## Known Issues
## Security Notes
## Open Questions
## Progress Log
```

Sections are PM-first: Summary and Capabilities up top, Known Issues / Security
Notes flagged in the detail panel, Open Questions and Files for devs, Progress
Log last as the audit trail (appended to automatically — don't hand-edit it).

## Webpage (`specdive view`)

- **List view** — **Done** / **Backlog** tabs (Done first). One list at a
  time; no text badges.
- **Detail panel** — full spec in PM-first order; Known Issues and Security
  Notes are flagged. No status badge — the breadcrumb is Done or Backlog.
- **Live updates** — file watcher + SSE, so the PM sees AI updates without
  refreshing.

## License

MIT
