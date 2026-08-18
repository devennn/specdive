/** Spec status values. The PM view is Done vs Backlog — these are the only two. */
export type Status = "done" | "backlog";

export const STATUS_VALUES: readonly Status[] = ["done", "backlog"] as const;

/** One git commit tagged onto a spec. SHA is supplied by the host assistant. */
export interface SpecCommit {
  sha: string;
  message: string;
  author?: string;
  committed_at?: string;
}

/** Structured frontmatter of a spec markdown file. */
export interface SpecFrontmatter {
  id: string;
  title: string;
  status: Status;
  source_files: string[];
  depends_on: string[];
  commits: SpecCommit[];
  updated_by: string;
  updated_at: string;
}

/**
 * A parsed spec. `body` is the prose markdown after the frontmatter,
 * stored verbatim so writes round-trip exactly. The body conventionally
 * uses `## Summary`, `## Capabilities`, etc. headings (see INSTRUCTIONS).
 */
export interface Spec {
  frontmatter: SpecFrontmatter;
  body: string;
}

/** Lightweight summary used by `state.json` and list views. */
export interface SpecSummary {
  id: string;
  title: string;
  status: Status;
  source_files: string[];
  depends_on: string[];
  updated_by: string;
  updated_at: string;
}

/** Inputs for `specdive_create_spec`. `content` becomes the prose body. */
export interface CreateSpecInput {
  title: string;
  status: string;
  content: string;
  source_files?: string[];
  depends_on?: string[];
}

/** Inputs for `specdive_tag_commit`. One SHA is tagged onto every listed spec. */
export interface TagCommitInput {
  sha: string;
  message: string;
  ids: string[];
  author?: string;
  committed_at?: string;
}

/** The derived state index, rebuilt from specs on change. */
export interface StateIndex {
  specs: SpecSummary[];
}
