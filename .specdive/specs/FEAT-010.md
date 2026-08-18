---
id: FEAT-010
title: CLI entry point & command routing
status: done
source_files:
  - src/index.ts
  - src/cli/exit-codes.ts
  - dev.js
depends_on:
  - FEAT-003
  - FEAT-004
  - FEAT-005
  - FEAT-006
commits:
  - sha: 32dbf00b17e7e52aaef0d84cd37669661575d84b
    message: Initial commit of specdive.
    author: Deven
    committed_at: '2026-08-18T10:39:52+08:00'
  - sha: 7c2f347421cbff479535382648c3cfa03c8d56e8
    message: Document CLI commands and MCP tools in the README.
    author: Deven
    committed_at: '2026-08-18T10:52:26+08:00'
updated_by: cursor
updated_at: '2026-08-18T06:28:45.371Z'
---
## Summary
The `specdive` CLI built on commander that dispatches the `init`,
`update`, `install`, `view`, and `mcp` subcommands, with a shared set of
exit codes and a `dev.js` shim for running from source via tsx.

## Capabilities
- Registers five subcommands: `init` (create `.specdive/` + optional MCP
  wire; refuses if it exists), `update` (refresh INSTRUCTIONS.md + missing
  AGENTS.md blocks), `install` (wire MCP only), `view` (PM webpage),
  `mcp` (stdio MCP server), with `--help`/`--version` and `exitOverride()`.
- Routes errors to documented exit codes: 0 success, 1 unexpected, 2
  usage/config, 3 port in use.
- Long-running commands (`view`, `mcp`) stay alive via their own
  listeners; non-success exits explicitly.
- `dev.js` spawns `tsx src/index.ts` with forwarded args so `specdive`
  runs from source before build.

## Known Issues
- `dev.js` assumes `node_modules/.bin/tsx` exists relative to the package;
  running it without installed dev deps fails opaquely.

## Open Questions
- Should the CLI add a `specdive list` / `specdive show` for terminal
  users, or stay setup/serving-only by design (analysis is the AI's job)?

## Progress Log
- 2026-08-13 (backfilled): CLI dispatcher, exit codes, and dev shim are
  complete; exercised indirectly by the CLI/MCP tests. No TODOs.
- 2026-08-17: Added `specdive update`.
