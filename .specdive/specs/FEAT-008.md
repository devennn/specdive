---
id: FEAT-008
title: Live reload (file watcher + SSE)
status: backlog
source_files:
  - src/view/server.ts
  - src/view/app-script.ts
depends_on:
  - FEAT-006
commits:
  - sha: 32dbf00b17e7e52aaef0d84cd37669661575d84b
    message: Initial commit of specdive.
updated_by: cursor
updated_at: '2026-08-18T02:40:24.541Z'
---
## Summary
Keeps the PM view live without a manual refresh: a chokidar watcher on
`.specdive/specs/*.md` pushes Server-Sent Events to the browser, which
re-fetches `/api/specs` on change.

## Capabilities
- Server watches `specs/*.md` (`ignoreInitial`) and, on any change, writes
  an SSE `change` event to all connected clients.
- `/api/events` opens a `text/event-stream`, sends a `: connected`
  comment, and tracks open responses; removes them on client close.
- Client opens an `EventSource` on `/api/events`, reloads specs on
  `change`, and on error closes and reconnects after 3s.
- The view stays read-only: it never writes specs; `state.json` is rebuilt
  by the write tools (MCP/CLI), the watcher just notifies.

## Known Issues
- The watcher only watches `specs/*.md`; changes to `config.yml` or
  `INSTRUCTIONS.md` won't trigger a reload.
- SSE reconnect is a fixed 3s backoff with no exponential scaling or
  max-retry; a long-down server spams reconnects.

## Open Questions
- Should the server throttle/coalesce rapid change bursts into one reload
  event to avoid redundant re-fetches?

## Progress Log
- 2026-08-13 (backfilled): File watcher + SSE live reload is implemented
  end-to-end; reconnect handling is naive. No TODOs.
