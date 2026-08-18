---
id: FEAT-005
title: MCP spec-writing tools (write-side surface)
status: done
source_files:
  - src/mcp/server.ts
  - src/mcp/handlers.ts
  - src/mcp/context.ts
  - src/version.ts
depends_on:
  - FEAT-001
  - FEAT-002
  - FEAT-003
updated_by: cursor
updated_at: '2026-08-18T01:27:00.000Z'
---
## Summary
The stdio MCP server that exposes specdive's write-side tools to an
AI coding assistant, plus the handler layer that turns those calls into
spec writes and returns structured tool results.

## Capabilities
- Registers eight tools: `specdive_health`, `specdive_init`,
  `specdive_update`, `specdive_create_spec`, `specdive_update_status`,
  `specdive_log_progress`, `specdive_tag_commit`, `specdive_list_specs`,
  each with zod-validated input schemas. `specdive_health` is a ping
  (no writes): returns `ok`, `name`, `version`, `initialized`, and
  `specdiveDir` so the host assistant can confirm the server is reachable.
- Handlers delegate to the spec write/read layer; success returns
  JSON-encoded content, failures return structured `isError` results so
  the host assistant can react.
- Validates inputs at the boundary (id format, status enum, required
  fields) before writing; bad status/id return actionable error text.
- Resolves the specdive dir as `process.cwd()/.specdive` (cwd-bound,
  git-free) and records `updated_by` from `SPECDIVE_UPDATED_BY` (default
  `mcp`).
- Runs over `StdioServerTransport`; a `wrap()` helper guarantees no thrown
  error escapes into the MCP framework (always a `ToolResult`, logged to
  stderr with the specdive prefix).

## Known Issues
- No read-file tool by design (the host has its own file tools); assistants
  that expect a generic read tool must be told to use their native tools.

## Security Notes
- The server only writes within `.specdive/` via the write guard; no
  codebase scanning, no LLM calls, no git. This is the product's trust
  model — never weakened.

## Open Questions
- Should `list_specs` return full bodies as well as summaries to avoid a
  second round-trip, or stay summary-only to keep payloads small?

## Progress Log
- 2026-08-13 (backfilled): MCP server and handlers for all five tools are
  complete; the MCP handler flow test (init → create → list → update →
  log) and error-case tests pass. No TODOs.
- 2026-08-17: Added `specdive_tag_commit` so one git SHA can be tagged
  onto one or more specs.
- 2026-08-17: Added `specdive_update`. `specdive_init` fails if
  `.specdive/` already exists.
- 2026-08-18: Added `specdive_health` so the assistant can ping the
  server and get version plus whether `.specdive/` is initialized.
