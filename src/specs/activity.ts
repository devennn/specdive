import { readAllSpecs } from "./read.js";
import type { SpecCommit, SpecFrontmatter } from "./types.js";

/** One spec referenced by an activity event. */
export interface ActivitySpec {
  id: string;
  title: string;
}

/** One git commit folded across every spec it was tagged onto. */
export interface ActivityEvent {
  sha: string;
  message: string;
  author?: string;
  committed_at?: string;
  specs: ActivitySpec[];
}

/** Derived activity index — rebuilt from spec files on each request. */
export interface ActivityIndex {
  events: ActivityEvent[];
}

/** Folds tagged commits by SHA. specdive does not read git. */
export function loadActivity(specdiveDir: string): ActivityIndex {
  const bySha = new Map<string, ActivityEvent>();
  for (const spec of readAllSpecs(specdiveDir)) {
    const fm = spec.frontmatter;
    for (const commit of fm.commits) addCommit(bySha, fm, commit);
  }
  const events = [...bySha.values()];
  for (const event of events) {
    event.specs.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  }
  events.sort(byTimeThenUntimed);
  return { events };
}

function addCommit(
  bySha: Map<string, ActivityEvent>,
  spec: SpecFrontmatter,
  c: SpecCommit,
): void {
  const existing = bySha.get(c.sha);
  if (!existing) {
    bySha.set(c.sha, newEvent(c, spec));
    return;
  }
  if (!existing.author && c.author) existing.author = c.author;
  if (!existing.committed_at && c.committed_at) existing.committed_at = c.committed_at;
  if (!existing.specs.some((s) => s.id === spec.id)) {
    existing.specs.push({ id: spec.id, title: spec.title });
  }
}

function newEvent(c: SpecCommit, spec: SpecFrontmatter): ActivityEvent {
  const event: ActivityEvent = {
    sha: c.sha,
    message: c.message,
    specs: [{ id: spec.id, title: spec.title }],
  };
  if (c.author !== undefined) event.author = c.author;
  if (c.committed_at !== undefined) event.committed_at = c.committed_at;
  return event;
}

/** Timed events newest-first; untimed last, then by SHA. */
function byTimeThenUntimed(a: ActivityEvent, b: ActivityEvent): number {
  if (a.committed_at && b.committed_at) {
    return b.committed_at.localeCompare(a.committed_at);
  }
  if (a.committed_at) return -1;
  if (b.committed_at) return 1;
  return a.sha.localeCompare(b.sha);
}
