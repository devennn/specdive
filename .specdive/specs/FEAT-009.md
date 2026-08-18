---
id: FEAT-009
title: MCP install status check
status: done
source_files:
  - src/cli/status.ts
  - src/view/server.ts
  - src/view/app-script.ts
depends_on:
  - FEAT-004
  - FEAT-006
commits:
  - sha: 32dbf00b17e7e52aaef0d84cd37669661575d84b
    message: Initial commit of specdive.
    author: Deven
    committed_at: '2026-08-18T10:39:52+08:00'
  - sha: 530340883ce3ddcddab281b9d8e02fc30a96cea9
    message: Add a History view of tagged commits as the default PM page.
    author: Deven Yantis
    committed_at: '2026-08-18T14:55:13+08:00'
updated_by: cursor
updated_at: '2026-08-18T06:56:26.199Z'
---
## Summary
Tells the PM (and developer) whether the specdive MCP server is installed
and reachable for each supported AI assistant, surfaced as a clickable
status pill in the view and a `/api/status` JSON endpoint.

## Capabilities
- `checkStatus` iterates supported targets that have a specdive entry in
  their config and reports, per target: `installed` (config + entry
  present), `commandResolves` (launch binary on PATH or an existing
  path), `reachable` (`<assistant> --version` exits 0 within 3s), and the
  registered command.
- Uses `which`/`where` and `<bin> --version` via short-lived subprocesses
  with 2–3s timeouts so a hung binary can't block the view.
- `/api/status` exposes the result as JSON; the client renders a status
  pill (ok / warn / off) listing every installed target (not just the
  first), with a tooltip of each command/reason. The pill is ok only
  when every listed target is installed, resolvable, and reachable.
- Clicking the pill re-runs the check; the result also drives the
  empty-state's "MCP connected" step.

## Known Issues
- Reachability reduces to "`<bin> --version` exits 0"; a host that's
  installed but misbehaves on `--version` would be reported unreachable.
- Subprocess spawning for status means the view server shells out to
  `which`/`where` and assistant CLIs on each check.

## Security Notes
- Only spawns the assistant's own version command and `which`/`where`
  with a fixed arg list and timeout; no user input reaches the shell.

## Open Questions
- Should the status check be cached for a few seconds to avoid re-spawning
  binaries on rapid pill clicks?

## Progress Log
- 2026-08-13 (backfilled): Status check, `/api/status` endpoint, and
  status-pill rendering are implemented; reachability is a coarse
  `--version` probe. No TODOs.
- 2026-08-18: Status pill listed only the first fully-ok target
  (cursor, given install order), so a dual cursor+opencode install
  showed cursor alone. Now lists every installed target.
