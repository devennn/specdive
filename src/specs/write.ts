import { existsSync } from "node:fs";
import { join } from "node:path";
import { specFilePath } from "../io/paths.js";
import { atomicWriteText } from "../io/atomic-write.js";
import type { WriteGuard } from "../io/write-guard.js";
import { nextSpecId, isSpecId, normalizeStatus } from "./ids.js";
import { readSpec, listSpecIds } from "./read.js";
import { serializeSpec } from "./serialize.js";
import { rebuildState } from "./state.js";
import { appendProgressEntry } from "./progress-log.js";
import type {
  CreateSpecInput,
  Spec,
  SpecFrontmatter,
  Status,
} from "./types.js";

export class SpecWriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpecWriteError";
  }
}

/** Current UTC time as an ISO-8601 `Z` timestamp, used for `updated_at`. */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Creates a new spec: assigns the next `FEAT-NNN` id, writes the markdown
 * file atomically, and rebuilds `state.json`. Returns the new id.
 */
export function createSpec(
  specdiveDir: string,
  input: CreateSpecInput,
  guard: WriteGuard,
  updatedBy: string,
): string {
  const status = validateCreateInput(input);
  const id = nextSpecId(listSpecIds(specdiveDir));
  if (existsSync(join(specdiveDir, specFilePath(id)))) {
    throw new SpecWriteError(`spec already exists: ${id}`);
  }

  const frontmatter: SpecFrontmatter = {
    id,
    title: input.title,
    status,
    source_files: input.source_files ?? [],
    depends_on: input.depends_on ?? [],
    commits: [],
    updated_by: updatedBy,
    updated_at: nowIso(),
  };

  const spec: Spec = { frontmatter, body: input.content };
  atomicWriteText(specdiveDir, specFilePath(id), serializeSpec(spec), guard);
  rebuildState(specdiveDir, guard);
  return id;
}

/** Replaces a spec's `status` and stamps `updated_at`/`updated_by`. */
export function updateStatus(
  specdiveDir: string,
  id: string,
  status: string,
  guard: WriteGuard,
  updatedBy: string,
): void {
  if (!isSpecId(id)) throw new SpecWriteError(`invalid id: ${id}`);
  const normalized = normalizeStatus(status);
  if (normalized === null) throw new SpecWriteError(`invalid status: ${status}`);
  const spec = readSpec(specdiveDir, id);
  spec.frontmatter.status = normalized;
  stamp(spec, updatedBy);
  atomicWriteText(specdiveDir, specFilePath(id), serializeSpec(spec), guard);
  rebuildState(specdiveDir, guard);
}

/**
 * Appends a timestamped entry (`- YYYY-MM-DD: note`) to the spec's
 * `## Progress Log` section (creating it if absent), then rewrites the
 * file and rebuilds state.
 */
export function logProgress(
  specdiveDir: string,
  id: string,
  note: string,
  guard: WriteGuard,
  updatedBy: string,
): void {
  if (!isSpecId(id)) throw new SpecWriteError(`invalid id: ${id}`);
  const trimmed = note.trim();
  if (trimmed.length === 0) {
    throw new SpecWriteError("progress note must not be empty");
  }
  const spec = readSpec(specdiveDir, id);
  spec.body = appendProgressEntry(spec.body, trimmed);
  stamp(spec, updatedBy);
  atomicWriteText(specdiveDir, specFilePath(id), serializeSpec(spec), guard);
  rebuildState(specdiveDir, guard);
}

function stamp(spec: Spec, updatedBy: string): void {
  spec.frontmatter.updated_by = updatedBy;
  spec.frontmatter.updated_at = nowIso();
}

function validateCreateInput(input: CreateSpecInput): Status {
  if (input.title.trim().length === 0) {
    throw new SpecWriteError("title must not be empty");
  }
  if (input.content.trim().length === 0) {
    throw new SpecWriteError("content must not be empty");
  }
  const status = normalizeStatus(input.status);
  if (status === null) {
    throw new SpecWriteError(`invalid status: ${input.status}`);
  }
  return status;
}
