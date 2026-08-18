import { specFilePath } from "../io/paths.js";
import { atomicWriteText } from "../io/atomic-write.js";
import type { WriteGuard } from "../io/write-guard.js";
import { isSpecId } from "./ids.js";
import { readSpec } from "./read.js";
import { serializeSpec } from "./serialize.js";
import { rebuildState } from "./state.js";
import {
  hasCommitSha,
  isCommitSha,
  normalizeSha,
  subjectLine,
  uniqueIds,
} from "./commits.js";
import { SpecWriteError, nowIso } from "./write.js";
import type { Spec, TagCommitInput } from "./types.js";

export interface TagCommitResult {
  sha: string;
  message: string;
  tagged: string[];
  already_tagged: string[];
}

/**
 * Tags one git commit onto one or more specs. The host assistant supplies
 * the SHA — specdive does not run git. Re-tagging the same SHA on a spec
 * is a no-op for that spec. Validates every id before writing any file.
 */
export function tagCommit(
  specdiveDir: string,
  input: TagCommitInput,
  guard: WriteGuard,
  updatedBy: string,
): TagCommitResult {
  const sha = requireSha(input.sha);
  const message = requireMessage(input.message);
  const ids = uniqueIds(input.ids);
  if (ids.length === 0) throw new SpecWriteError("ids must not be empty");
  for (const id of ids) {
    if (!isSpecId(id)) throw new SpecWriteError(`invalid id: ${id}`);
  }

  const tagged: string[] = [];
  const alreadyTagged: string[] = [];
  const loaded = ids.map((id) => ({ id, spec: readSpec(specdiveDir, id) }));
  for (const { id, spec } of loaded) {
    if (hasCommitSha(spec.frontmatter.commits, sha)) {
      alreadyTagged.push(id);
      continue;
    }
    spec.frontmatter.commits = [...spec.frontmatter.commits, { sha, message }];
    stamp(spec, updatedBy);
    atomicWriteText(specdiveDir, specFilePath(id), serializeSpec(spec), guard);
    tagged.push(id);
  }
  if (tagged.length > 0) rebuildState(specdiveDir, guard);
  return { sha, message, tagged, already_tagged: alreadyTagged };
}

function requireSha(raw: string): string {
  const sha = normalizeSha(raw);
  if (!isCommitSha(sha)) {
    throw new SpecWriteError(`invalid sha: ${raw} (expected 7–64 hex chars)`);
  }
  return sha;
}

function requireMessage(raw: string): string {
  const message = subjectLine(raw);
  if (message === null) {
    throw new SpecWriteError("commit message must not be empty");
  }
  return message;
}

function stamp(spec: Spec, updatedBy: string): void {
  spec.frontmatter.updated_by = updatedBy;
  spec.frontmatter.updated_at = nowIso();
}
