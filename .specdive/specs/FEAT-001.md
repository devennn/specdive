---
id: FEAT-001
title: Spec data model & file format
status: done
source_files:
  - src/specs/types.ts
  - src/specs/parse.ts
  - src/specs/serialize.ts
  - src/specs/ids.ts
  - src/specs/read.ts
  - src/specs/commits.ts
depends_on: []
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
updated_at: '2026-08-18T06:56:26.193Z'
---
## Summary
The in-memory and on-disk representation of a feature spec — YAML
frontmatter plus a prose markdown body — and the helpers that read,
validate, serialize, and assign IDs to spec files under
`.specdive/specs/`.

## Capabilities
- Defines the `Spec` / `SpecFrontmatter` / `SpecSummary` / `Status`
  types and the `done | backlog` status enum. Legacy `todo` /
  `in_progress` / `blocked` values coerce to `backlog` on parse.
- Parses markdown + YAML frontmatter via gray-matter, validating the id
  (`FEAT-NNN`), status, and required string/array fields; bad frontmatter
  throws a typed `SpecParseError`. Frontmatter `commits` is an array of
  `{ sha, message }`; missing `commits` parses as `[]`.
- Serializes specs back to canonical markdown with frontmatter keys in a
  fixed order, so write → read → write is byte-stable (deterministic
  js-yaml dump).
- Assigns the next `FEAT-NNN` id by scanning existing ids and incrementing
  the highest; zero-pads to 3 digits (`FEAT-001` … `FEAT-999`, then
  `FEAT-1000`).
- Reads and lists spec summaries (sorted by numeric id), tolerating one
  unreadable spec without aborting the list.

## Known Issues
- Listing is tolerant of bad specs (silently skips them), so a corrupt spec
  file can be invisible in the PM view with no surfaced error.

## Security Notes
- Frontmatter parsing trusts gray-matter/js-yaml. Spec files are meant to
  be committed and reviewed like code, so this is acceptable, but arbitrary
  YAML is parsed (no schema-restricted loader).

## Open Questions
- `NEW_SPECS.md` raised an optional `Confidence` frontmatter field
  (`high | medium | low`) to signal how thoroughly the AI traced a feature
  before labeling it — not yet decided or implemented.

## Progress Log
- 2026-08-13 (backfilled): Spec model, parser, serializer, id assignment,
  and readers are complete and covered by round-trip, id, and status
  tests. No TODOs in code.
- 2026-08-14: Status enum collapsed to `done | backlog`; legacy values
  coerce to `backlog`.
- 2026-08-17: Frontmatter gained `commits: [{ sha, message }]`; older
  specs without the field parse as `[]`.
