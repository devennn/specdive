import matter from "gray-matter";
import type { Spec, SpecFrontmatter } from "./types.js";

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
    commits: fm.commits,
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
