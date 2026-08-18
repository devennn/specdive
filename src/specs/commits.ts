import type { SpecCommit } from "./types.js";

/** Git SHA-1 (40) or SHA-256 (64), or an abbreviation of at least 7 hex chars. */
export const COMMIT_SHA_PATTERN = /^[0-9a-f]{7,64}$/i;

/** True if `value` looks like a git commit SHA (full or abbreviated). */
export function isCommitSha(value: string): boolean {
  return COMMIT_SHA_PATTERN.test(value);
}

/** Lowercases a SHA so re-tags compare equal regardless of the agent's casing. */
export function normalizeSha(value: string): string {
  return value.trim().toLowerCase();
}

/** True if this spec already has an entry for `sha`. */
export function hasCommitSha(commits: readonly SpecCommit[], sha: string): boolean {
  return commits.some((c) => c.sha === sha);
}

/** First line of a commit message, trimmed. Empty after trim → null. */
export function subjectLine(message: string): string | null {
  const first = message.split("\n")[0]!.trim();
  return first.length === 0 ? null : first;
}

/** Dedupes ids while keeping first-seen order. */
export function uniqueIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}
