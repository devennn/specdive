---
id: FEAT-011
title: Tag commits onto specs
status: done
source_files:
  - src/specs/tag-commit.ts
  - src/specs/commits.ts
  - src/mcp/server.ts
  - src/mcp/handlers.ts
  - src/cli/agent-instructions.ts
  - src/specs/instructions.ts
  - src/view/app-script.ts
  - src/view/styles.ts
depends_on:
  - FEAT-001
  - FEAT-002
  - FEAT-003
  - FEAT-004
  - FEAT-005
  - FEAT-006
commits:
  - sha: 32dbf00b17e7e52aaef0d84cd37669661575d84b
    message: Initial commit of specdive.
    author: Deven
    committed_at: '2026-08-18T10:39:52+08:00'
  - sha: 878a3ed3f0a359a94078e1f12b56d53fca2a69f9
    message: Track Cursor and OpenCode MCP configs in git.
    author: Deven
    committed_at: '2026-08-18T10:43:04+08:00'
updated_by: cursor
updated_at: '2026-08-18T06:28:45.394Z'
---
## Summary

After an AI coding agent creates a git commit, it tags that commit onto
every spec the diff touches — one SHA can land on multiple specs — so
the PM view shows which commits shipped each feature. specdive stays
git-free: the agent supplies the SHA.

## Capabilities

- `specdive_tag_commit({sha, message, ids})` appends `{ sha, message }`
  to each listed spec's frontmatter `commits`. One call tags the same
  commit onto multiple specs. Optional `author` and `committed_at` are
  stored when supplied.
- SHA is 7–64 hex chars (full or abbreviated); stored lowercase. The
  commit subject is the first line of `message`.
- Re-tagging the same SHA on the same spec is a no-op, except it fills
  missing `author` / `committed_at` when those are supplied. Missing
  `commits` on older specs parses as `[]`.
- `.specdive/INSTRUCTIONS.md` tells the assistant to call
  `specdive_tag_commit` after every git commit it creates.
- `specdive init` / `install` / `update` insert a marked
  `<!-- specdive:commit-tag -->` block into `AGENTS.md` (Cursor,
  OpenCode) so the instruction is in session context without an MCP
  call. Insert-if-missing; re-install does not overwrite a user-edited
  block.
- The PM detail panel lists tagged commits (short SHA + subject,
  newest first).

## Known Issues

- An agent can still ignore `AGENTS.md` and skip the MCP call; there is
  no git hook. That's inherent integration fragility, not a break in
  normal use when the instruction is followed.

## Security Notes

- specdive never shells out to git or imports commit history. The
  assistant runs git and passes the SHA. No SHA is verified against a
  repo — a fabricated hash would be stored as given.

## Open Questions

- None. Instruction-only (not a host hook). The agent picks spec ids
  from the diff plus `specdive_list_specs`.

## Progress Log

- 2026-08-14 (backfilled): Spec existed as a backlog item for updating
  specs on AI-agent commit; no write path yet.
- 2026-08-17: Implemented `specdive_tag_commit`, frontmatter `commits`,
  INSTRUCTIONS + AGENTS.md commit-tag block, and Commits in the PM
  detail panel.
- 2026-08-18: Re-tag fills missing author and committed_at on an existing SHA. Tagged this month's git commits onto the specs they touched.
