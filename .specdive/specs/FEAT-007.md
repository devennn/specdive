---
id: FEAT-007
title: Mind map dependency view
status: backlog
source_files:
  - src/view/app-script.ts
depends_on:
  - FEAT-006
updated_by: mcp
updated_at: "2026-08-13T08:49:02.989Z"
---
 
## Summary

A toggle in the PM view that renders specs as a dependency graph (inline
SVG) built from each spec's `depends_on`, with nodes colored by status,
so a PM can see what depends on what.

## Capabilities

- Lays specs out into columns by dependency depth (longest `depends_on`
  chain), positions nodes on a fixed grid, and draws lines from each spec
  to the specs it depends on.
- Nodes are `<g>` rects colored by status (`done`/`backlog`) with the id and a truncated title; clicking a node selects that
  spec and switches back to the list/detail view.
- Empty state ("No specs to map.") when there are no specs.
- Cycle-tolerant depth calculation (a `seen` set caps cycles at depth 0).

## Known Issues

- Layout is a simple fixed-grid with no collision avoidance or zoom/pan;
  large graphs overlap and become unreadable.
- No edge labels or direction arrows; dependency direction is implied by
  column order only.

## Open Questions

- Should the mind map use a real graph-layout library (e.g. react-flow, as
  originally suggested in NEW_SPECS.md) for larger graphs, or stay
  dependency-free SVG?

## Progress Log

- 2026-08-13 (backfilled): Mind map renders an SVG dependency graph with
  status-colored clickable nodes; layout is basic and untested. No TODOs.
