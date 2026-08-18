---
id: FEAT-006
title: PM view webpage (list + detail)
status: backlog
source_files:
  - src/view/server.ts
  - src/view/html.ts
  - src/view/styles.ts
  - src/view/app-script.ts
  - src/view/icon.ts
  - src/specs/config.ts
  - src/cli/view.ts
depends_on:
  - FEAT-001
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
updated_at: '2026-08-18T06:56:26.198Z'
---
## Summary
`specdive view` starts a local express server (default 127.0.0.1:4747)
serving a single-page app that shows features in Done / Backlog tabs,
with a PM-first detail panel for the selected spec.

## Capabilities
- Serves an inline HTML/CSS/JS SPA (no framework, no bundler) at `/`, plus
  JSON APIs: `/api/specs` (state index), `/api/specs/:id` (full spec),
  `/api/status`, and `/api/events` (SSE). Favicon at `/favicon.svg` and
  `/favicon.ico`.
- Header brand is the specdive icon plus `{project} Specs`. `project`
  comes from `.specdive/config.yml`; if unset, the working directory name.
- List view uses **Done** / **Backlog** tabs (Done first). One list at a
  time, title + status dot, no text badges. Within each tab, specs are
  sorted latest-first (highest id at the top). Opening a spec in the other
  group (e.g. a dependency link) switches the tab. The selected spec and
  list tab live in the URL (`?tab=backlog&id=FEAT-NNN`); outline links
  set the hash. Refresh restores the same view.
- Detail panel follows a docs-site layout: breadcrumb (Done/Backlog ›
  title), large title, then a meta row (id pill, date, author) and headed
  sections.
  Known Issues and Security Notes are callouts; files are listed as
  paths; `depends_on` are links; tagged `commits` are short SHA +
  subject (newest first). An **On this page** outline on the right
  lists sections and scrolls the article to the chosen heading.
- Empty state shows an onboarding checklist (connect MCP, ask the
  assistant to initialize) when no specs exist.
- Help copy is behind `i` info-tips (per the UI help-copy rule); the empty
  state is the one inline-prose exception.
- Light/dark theme toggle, persisted in localStorage.
- `specdive view` prints the URL and stays running until killed; refuses
  to start if `.specdive/` isn't initialized; port-in-use exits with code 3.

## Known Issues
- Frontend has no automated tests; rendering bugs (section parsing,
  escaping, layout) would only surface manually.

## Open Questions
- None. Markdown in the detail panel is rendered to HTML (escaped text,
  not a full CommonMark parser).

## Progress Log
- 2026-08-13 (backfilled): View server and SPA (list, detail, empty state,
  info-tips) are implemented and functional; frontend is untested. No
  TODOs.
- 2026-08-13: Redesigned the detail panel for readability — lead summary,
  section cards, flagged callouts, timeline progress log, file/dependency
  chips, human-readable dates, and markdown-to-HTML rendering.
- 2026-08-13: Flattened the detail panel to a docs-page layout — headings
  and spacing instead of nested cards, callouts only for issues/security,
  files as paths, dependencies as links.
- 2026-08-13: Docs-site article layout (breadcrumb, id pill, large title)
  plus an On this page outline that scrolls to sections.
- 2026-08-13: Header shows the specdive icon and `{project} Specs`; matching
  favicon served at `/favicon.svg`.
- 2026-08-14: Status is `done` or `backlog` only — no text badges in list
  or detail; the group heading is the label.
- 2026-08-14: Sidebar is Done / Backlog tabs (Done first) instead of
  stacked groups.
- 2026-08-14: Clicks write the tab, spec id, and outline section into
  the URL so refresh keeps the same view.
- 2026-08-14: Done and Backlog lists sort latest-first (highest id at
  the top) instead of alphabetically by title.
- 2026-08-17: Detail panel lists tagged commits (short SHA + subject,
  newest first) from frontmatter `commits`.
