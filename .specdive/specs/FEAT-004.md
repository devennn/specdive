---
id: FEAT-004
title: MCP host install
status: done
source_files:
  - src/cli/install.ts
  - src/cli/agent-instructions.ts
depends_on: []
commits:
  - sha: 32dbf00b17e7e52aaef0d84cd37669661575d84b
    message: Initial commit of specdive.
    author: Deven
    committed_at: '2026-08-18T10:39:52+08:00'
  - sha: 878a3ed3f0a359a94078e1f12b56d53fca2a69f9
    message: Track Cursor and OpenCode MCP configs in git.
    author: Deven
    committed_at: '2026-08-18T10:43:04+08:00'
  - sha: 3e3656ec042cf53a6769ccf126046ac38223a266
    message: Drop NEW_SPECS.md and slim the README.
    author: Deven
    committed_at: '2026-08-18T10:49:20+08:00'
  - sha: 530340883ce3ddcddab281b9d8e02fc30a96cea9
    message: Add a History view of tagged commits as the default PM page.
    author: Deven Yantis
    committed_at: '2026-08-18T14:55:13+08:00'
updated_by: cursor
updated_at: '2026-08-18T06:56:26.197Z'
---
## Summary
`specdive install --target <cursor|opencode>` wires the
specdive MCP server into a host AI assistant's config file as a local
(stdio) server and inserts the Spec Status Decision Rule, the
commit-tagging instruction, and the project-management sync instruction
into `AGENTS.md` if those blocks are not already there. Does not write
`.gitignore`.

## Capabilities
- Supports two targets with their distinct config shapes/locations:
  Cursor (`.cursor/mcp.json`, `command`+`args`) and opencode
  (`opencode.json`, `type: "local"` with `command` as one array).
- Deep-merges into an existing config: preserves other MCP servers and
  top-level keys; on the specdive entry, keeps user customizations (env,
  `enabled`, `timeout`) while forcing only the launch-command keys
  (`command`/`args`/`type`) back to current so a stale command never
  survives a re-install.
- Launch command defaults to `npx specdive mcp`, overridable via
  `SPECDIVE_CMD`.
- Exposes `readSpecdiveCommand` / `targetFilePath` helpers used by the
  status check.
- Inserts marked blocks into `AGENTS.md` if the start marker is absent:
  Spec Status Decision Rule (`<!-- specdive:status-rule -->`),
  commit tagging (`<!-- specdive:commit-tag -->`), and project-management
  sync (`<!-- specdive:pm-sync -->`). Re-install leaves an
  existing block unchanged so the project can edit the default. The
  agent file is committed, not gitignored.

## Known Issues

## Security Notes
- Only ever writes a LOCAL (stdio) server entry — never a remote/url entry
  — matching the trust model. specdive does not gitignore the host config;
  the user decides whether to commit it. The agent instruction file
  (`AGENTS.md`) is committed.

## Open Questions
- Stay limited to Cursor and OpenCode; no plugin/registry for other hosts.

## Progress Log
- 2026-08-13 (backfilled): Install handles all three targets with
  idempotent merge and stale-command forcing; covered by the install
  test suite. No TODOs.
- 2026-08-14: Install injects the Spec Status Decision Rule into the
  host agent file (insert-if-missing).
- 2026-08-14: Default rule is `done | backlog`.
- 2026-08-14: Dropped Claude Code. Install targets are cursor and
  opencode only; status rule always goes to `AGENTS.md`.
- 2026-08-17: Install also injects a commit-tag instruction into
  `AGENTS.md` (insert-if-missing) so Cursor/OpenCode call
  `specdive_tag_commit` after every git commit.
- 2026-08-17: Install no longer appends the host config to `.gitignore`.
- 2026-08-19: Install also injects a pm-sync instruction into
  `AGENTS.md` (insert-if-missing) so the assistant updates ClickUp
  (or similar) when starting or completing a spec, if a connector is
  available.
