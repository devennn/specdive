import matter from "gray-matter";
import { normalizeStatus, isSpecId } from "./ids.js";
import { isCommitSha, normalizeSha } from "./commits.js";
import type { Spec, SpecCommit, SpecFrontmatter, SpecSummary } from "./types.js";

export class SpecParseError extends Error {
  constructor(file: string, reason: string) {
    super(`Invalid spec ${file}: ${reason}`);
    this.name = "SpecParseError";
  }
}

/** Parsed gray-matter result, narrowed to the frontmatter shape we expect. */
interface ParsedSpec {
  data: Record<string, unknown>;
  content: string;
}

/** Parses raw markdown text into a `Spec`, validating and normalizing frontmatter. */
export function parseSpec(text: string, file = "<spec>"): Spec {
  const parsed = matter(text) as unknown as ParsedSpec;
  const fm = normalizeFrontmatter(parsed.data, file);
  return { frontmatter: fm, body: parsed.content };
}

/** Extracts only the PM-list summary fields from a parsed spec. */
export function toSummary(spec: Spec): SpecSummary {
  const fm = spec.frontmatter;
  return {
    id: fm.id,
    title: fm.title,
    status: fm.status,
    source_files: fm.source_files,
    depends_on: fm.depends_on,
    updated_by: fm.updated_by,
    updated_at: fm.updated_at,
  };
}

/**
 * Coerces a raw parsed-data object into a `SpecFrontmatter`, validating
 * required fields and id/status formats. Missing optional arrays default
 * to empty; bad types throw `SpecParseError`.
 */
function normalizeFrontmatter(
  data: Record<string, unknown>,
  file: string,
): SpecFrontmatter {
  const id = stringField(data, "id", file);
  if (!isSpecId(id)) {
    throw new SpecParseError(file, `id must match FEAT-NNN, got "${id}"`);
  }
  const title = stringField(data, "title", file);
  const rawStatus = stringField(data, "status", file);
  const status = normalizeStatus(rawStatus);
  if (status === null) {
    throw new SpecParseError(
      file,
      `status must be done or backlog, got "${rawStatus}"`,
    );
  }
  const updatedBy = stringField(data, "updated_by", file);
  const updatedAt = stringField(data, "updated_at", file);
  const sourceFiles = stringArrayField(data, "source_files", file);
  const dependsOn = stringArrayField(data, "depends_on", file);
  const commits = commitArrayField(data, file);

  return {
    id,
    title,
    status,
    source_files: sourceFiles,
    depends_on: dependsOn,
    commits,
    updated_by: updatedBy,
    updated_at: updatedAt,
  };
}

function stringField(
  data: Record<string, unknown>,
  key: string,
  file: string,
): string {
  const v = data[key];
  if (typeof v !== "string" || v.length === 0) {
    throw new SpecParseError(file, `${key} must be a non-empty string`);
  }
  return v;
}

function stringArrayField(
  data: Record<string, unknown>,
  key: string,
  file: string,
): string[] {
  const v = data[key];
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) {
    throw new SpecParseError(file, `${key} must be an array of strings`);
  }
  return v.map((item, i) => {
    if (typeof item !== "string") {
      throw new SpecParseError(file, `${key}[${i}] must be a string`);
    }
    return item;
  });
}

function commitArrayField(
  data: Record<string, unknown>,
  file: string,
): SpecCommit[] {
  const v = data.commits;
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) {
    throw new SpecParseError(file, "commits must be an array");
  }
  return v.map((item, i) => parseCommit(item, file, i));
}

function parseCommit(item: unknown, file: string, i: number): SpecCommit {
  if (item === null || typeof item !== "object" || Array.isArray(item)) {
    throw new SpecParseError(file, `commits[${i}] must be an object`);
  }
  const fields = commitFields(item);
  const sha = commitString(fields.sha, file, i, "sha");
  if (!isCommitSha(sha)) {
    throw new SpecParseError(file, `commits[${i}].sha must be a git SHA, got "${sha}"`);
  }
  const message = commitString(fields.message, file, i, "message");
  return { sha: normalizeSha(sha), message };
}

interface CommitFields {
  sha: unknown;
  message: unknown;
}

function commitFields(item: object): CommitFields {
  const rec = item as CommitFields;
  return { sha: rec.sha, message: rec.message };
}

function commitString(
  value: unknown,
  file: string,
  i: number,
  key: string,
): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new SpecParseError(file, `commits[${i}].${key} must be a non-empty string`);
  }
  return value;
}
