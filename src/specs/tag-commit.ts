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
import type { Spec, SpecCommit, TagCommitInput } from "./types.js";

export interface TagCommitResult {
  sha: string;
  message: string;
  tagged: string[];
  already_tagged: string[];
}

/**
 * Tags one git commit onto one or more specs. The host assistant supplies
 * the SHA — specdive does not run git. Re-tagging the same SHA is a no-op
 * unless author or committed_at is missing and supplied this time.
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
  const entry = commitEntry(sha, message, {
    author: input.author,
    committed_at: input.committed_at,
    updatedBy,
  });
  for (const { id, spec } of loaded) {
    if (hasCommitSha(spec.frontmatter.commits, sha)) {
      if (!fillMissingCommitMeta(spec, sha, input)) {
        alreadyTagged.push(id);
        continue;
      }
    } else {
      spec.frontmatter.commits = [...spec.frontmatter.commits, { ...entry }];
    }
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

function commitEntry(
  sha: string,
  message: string,
  opts: { author?: string; committed_at?: string; updatedBy: string },
): SpecCommit {
  return {
    sha,
    message,
    author: optionalText(opts.author) ?? opts.updatedBy,
    committed_at: optionalIso(opts.committed_at) ?? nowIso(),
  };
}

function optionalText(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const t = raw.trim();
  return t.length === 0 ? undefined : t;
}

function optionalIso(raw: string | undefined): string | undefined {
  const t = optionalText(raw);
  if (t === undefined) return undefined;
  if (Number.isNaN(Date.parse(t))) {
    throw new SpecWriteError(`invalid committed_at: ${raw}`);
  }
  return t;
}

/** Fills author / committed_at on an existing SHA when those fields were omitted. */
function fillMissingCommitMeta(
  spec: Spec,
  sha: string,
  input: TagCommitInput,
): boolean {
  const commit = spec.frontmatter.commits.find((c) => c.sha === sha);
  if (commit === undefined) return false;
  let changed = false;
  const author = optionalText(input.author);
  if (commit.author === undefined && author !== undefined) {
    commit.author = author;
    changed = true;
  }
  const committedAt = optionalIso(input.committed_at);
  if (commit.committed_at === undefined && committedAt !== undefined) {
    commit.committed_at = committedAt;
    changed = true;
  }
  return changed;
}
