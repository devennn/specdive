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
  Don't ask the user to do this manually. If a project-management
  connector is available in this session (ClickUp, Linear, Jira, etc.),
  update the matching remote task too. If none is connected, proceed.

- After every git commit you create, call specdive_tag_commit with the
  new SHA, the commit subject, the author, the commit time (ISO-8601),
  and every FEAT-NNN spec the commit touches. One commit may tag
  multiple specs. Do this as part of the commit — don't ask the user.
  specdive does not run git; you pass the SHA, author, and time from
  the commit you just created.

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

## Specdive project-management sync

When you start or complete work on a spec (call `specdive_update_status`
and `specdive_log_progress`), also update the matching task in the
user's other project-management software (ClickUp, Linear, Jira, GitHub
Issues, or similar) if a connector is already available in this session
— an MCP server, CLI, or other tool the host has connected.

If no such tool is connected, or you cannot find a matching task,
proceed with the specdive write and do not ask the user to connect a
tracker. Do not fail the task because the tracker update failed.
specdive does not talk to those tools; you do.

If the host AGENTS.md contains a `<!-- specdive:pm-sync -->` block, follow that over this default.

## Spec file layout

Each spec is a markdown file with YAML frontmatter. Use these section
headings in this order (PM-relevant first):

```markdown
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
    author: cursor
    committed_at: 2026-08-13T10:22:00Z
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

Put the goal description (the `content` arg to specdive_create_spec)
into these sections as prose. specdive_log_progress appends timestamped
entries to `## Progress Log` automatically — don't hand-edit the log.
specdive_tag_commit appends to frontmatter `commits` — don't hand-edit
that list either.
