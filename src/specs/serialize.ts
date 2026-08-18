import matter from "gray-matter";
import type { Spec, SpecCommit, SpecFrontmatter } from "./types.js";

/**
 * Builds a frontmatter object in canonical key order. gray-matter (js-yaml)
 * emits keys in insertion order, so always serializing through this keeps
 * spec files byte-stable across rewrites.
 */
export function toFrontmatter(fm: SpecFrontmatter): SpecFrontmatter {
  // Spread through an ordered literal so serialization order is fixed.
  return {
    id: fm.id,
    title: fm.title,
    status: fm.status,
    source_files: fm.source_files,
    depends_on: fm.depends_on,
    commits: fm.commits.map(orderedCommit),
    updated_by: fm.updated_by,
    updated_at: fm.updated_at,
  };
}

/**
 * Serializes a spec into its canonical markdown form: YAML frontmatter
 * (keys in fixed order) followed by the verbatim prose body. Output is a
 * pure function of the Spec, so write → read → write is byte-identical
 * (js-yaml dump is deterministic for a given data object).
 */
export function serializeSpec(spec: Spec): string {
  return matter.stringify(spec.body, toFrontmatter(spec.frontmatter));
}

/** Canonical commit key order; omits unset optional fields. */
function orderedCommit(c: SpecCommit): SpecCommit {
  const out: SpecCommit = { sha: c.sha, message: c.message };
  if (c.author !== undefined) out.author = c.author;
  if (c.committed_at !== undefined) out.committed_at = c.committed_at;
  return out;
}
