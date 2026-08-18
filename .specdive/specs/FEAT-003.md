---
id: FEAT-003
title: .specdive/ scaffolding & init
status: done
source_files:
  - src/scaffold.ts
  - src/cli/init.ts
  - src/cli/update.ts
  - src/specs/instructions.ts
depends_on:
  - FEAT-002
commits:
  - sha: 32dbf00b17e7e52aaef0d84cd37669661575d84b
    message: Initial commit of specdive.
    author: Deven
    committed_at: '2026-08-18T10:39:52+08:00'
  - sha: 3e3656ec042cf53a6769ccf126046ac38223a266
    message: Drop NEW_SPECS.md and slim the README.
    author: Deven
    committed_at: '2026-08-18T10:49:20+08:00'
updated_by: cursor
updated_at: '2026-08-18T06:28:45.364Z'
---
## Summary
`specdive init` creates `.specdive/` from scratch. `specdive update`
refreshes specdive-owned instructions on an existing tree. The two
commands do not share a write path: init refuses if data exists; update
never touches `config.yml` or specs.

## Capabilities
- `init` / `specdive_init` creates `.specdive/specs/` and writes
  `config.yml` and `INSTRUCTIONS.md` — all through the write guard — then
  rebuilds `state.json`. Fails if `.specdive/` already exists. Does not
  write `.gitignore`.
- `update` / `specdive_update` rewrites only `INSTRUCTIONS.md` to the
  current contract and injects missing `AGENTS.md` blocks (status-rule,
  commit-tag). Insert-if-missing; user-edited blocks are left unchanged.
- The CLI `init` optionally wires the MCP server via an interactive target
  prompt (`cursor` / `opencode`) or `--target`, then prints
  next steps; non-TTY shells skip the prompt gracefully.
- Returns the `INSTRUCTIONS` content so the MCP tool can surface it to the
  host assistant in-context.
- `INSTRUCTIONS.md` includes the Spec Status Decision Rule (`done` vs
  `backlog`), the commit-tagging instruction, and tells the assistant to
  call `specdive_update` (not `specdive_init`) when `.specdive/` already
  exists. MCP init does not write a host `AGENTS.md` (no provider). CLI
  `init --target` injects those blocks via install; `update` injects them
  itself.

## Known Issues
- `init` and `update` always operate on `process.cwd()`; running them from
  outside the repo root writes in the wrong place (by design — git-free
  and cwd-bound).

## Security Notes
- All `.specdive/` writes pass the write guard; `.env*` remain protected.
- `update` does not overwrite `config.yml` or spec files.

## Open Questions

## Progress Log
- 2026-08-13 (backfilled): Scaffolding is complete and idempotent;
  exercised by the MCP handler and CLI init tests. No TODOs.
- 2026-08-14: INSTRUCTIONS.md now ships the Spec Status Decision Rule as
  the canonical default; host-file inject is install's job.
- 2026-08-14: Status is `done | backlog` only.
- 2026-08-14: Init target prompt is cursor / opencode only.
- 2026-08-17: INSTRUCTIONS.md tells the assistant to call
  `specdive_tag_commit` after every git commit it creates.
- 2026-08-17: INSTRUCTIONS.md now tells assistants to use specdive as
  the primary specs system for questions, references, discussions, and
  progress — not chat-only.
- 2026-08-17: Split create vs refresh. `init` refuses if `.specdive/`
  exists. `update` refreshes INSTRUCTIONS.md and missing AGENTS.md
  blocks only.
- 2026-08-17: `init` no longer writes `.specdive/.gitignore`.
