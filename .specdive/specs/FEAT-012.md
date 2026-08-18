---
id: FEAT-012
title: Activity history
status: done
source_files:
  - src/specs/activity.ts
  - src/specs/types.ts
  - src/specs/parse.ts
  - src/specs/serialize.ts
  - src/specs/tag-commit.ts
  - src/specs/read.ts
  - src/mcp/server.ts
  - src/specs/instructions.ts
  - src/view/server.ts
  - src/view/app-script.ts
  - src/view/styles.ts
depends_on:
  - FEAT-006
  - FEAT-011
commits:
  - sha: 530340883ce3ddcddab281b9d8e02fc30a96cea9
    message: Add a History view of tagged commits as the default PM page.
    author: Deven Yantis
    committed_at: '2026-08-18T14:55:13+08:00'
updated_by: cursor
updated_at: '2026-08-18T06:56:26.200Z'
---
## Summary

The PM view opens on a History timeline of git commits tagged onto specs.
One SHA becomes one row with feature chips. specdive does not run git.

## Capabilities

- History is the default view; Specs opens the latest Done feature.
- `GET /api/activity` folds frontmatter `commits` by SHA into events
  with author, time, and the specs that SHA was tagged onto.
- `specdive_tag_commit` stores optional `author` and `committed_at`.
  If omitted, they are stamped from the MCP host and the current time.
- Events with a time group by day (Today / Yesterday / date); events
  without `committed_at` land in Untimed. Empty state when none tagged.
- The view refetches activity on SSE spec-file changes.
- History shows 5 day groups per page (newest first), with Newer / Older
  to page through the rest.

## Known Issues

- Events with only sha + message (no `committed_at`) land in Untimed.
  Re-tagging that SHA with `committed_at` fills the missing field.
- The host `AGENTS.md` commit-tag block is insert-if-missing; re-install
  will not add the new author/time fields to an existing block.
- An agent can skip the MCP call; there is no git hook.

## Security Notes

- specdive never shells out to git. The assistant supplies SHA, author,
  and time. No SHA is verified against a repo.

## Open Questions

- None. Aggregation is derived at request time from spec files.

## Progress Log

- 2026-08-18 (backfilled): History UI existed with mock events; commits
  on specs were sha + message only; no activity API.
- 2026-08-18: Wired History to GET /api/activity; tag_commit stores author and committed_at.
- 2026-08-18: History now has all August commits (author + committed_at): initial ship, MCP configs tracked in git, README slim, CLI/MCP README docs.
- 2026-08-18: History paginates 5 day groups at a time (Newer / Older).
