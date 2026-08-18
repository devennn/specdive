import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { specFilePath, paths } from "../io/paths.js";
import { parseSpec, toSummary } from "./parse.js";
import { isSpecId } from "./ids.js";
import type { Spec, SpecSummary, Status } from "./types.js";

/** Returns true if a `.specdive/` looks initialized (has a specs/ dir). */
export function isInitialized(specdiveDir: string): boolean {
  return existsSync(join(specdiveDir, paths.specsDir));
}

/** Reads and parses one spec by id; throws if the file is missing or invalid. */
export function readSpec(specdiveDir: string, id: string): Spec {
  const file = specFilePath(id);
  const text = readFileSync(join(specdiveDir, file), "utf8");
  return parseSpec(text, file);
}

/** Reads every parsable spec; skips unreadable files so listing does not abort. */
export function readAllSpecs(specdiveDir: string): Spec[] {
  return listSpecIds(specdiveDir)
    .map((id) => {
      try {
        return readSpec(specdiveDir, id);
      } catch {
        return null;
      }
    })
    .filter((s): s is Spec => s !== null);
}

/** Returns the summaries of all specs, sorted by id. */
export function readAllSummaries(specdiveDir: string): SpecSummary[] {
  return readAllSpecs(specdiveDir).map(toSummary).sort(byId);
}

/** Lists spec summaries, optionally filtered by status. */
export function listSummaries(
  specdiveDir: string,
  status?: Status,
): SpecSummary[] {
  const all = readAllSummaries(specdiveDir);
  return status ? all.filter((s) => s.status === status) : all;
}

/** Returns all valid `FEAT-NNN` ids found in the specs dir, in numeric order. */
export function listSpecIds(specdiveDir: string): string[] {
  const specsDir = join(specdiveDir, paths.specsDir);
  if (!existsSync(specsDir)) return [];
  return readdirSync(specsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.slice(0, -3))
    .filter(isSpecId)
    .sort(byNumericId);
}

function byId(a: SpecSummary, b: SpecSummary): number {
  return a.id.localeCompare(b.id, undefined, { numeric: true });
}

function byNumericId(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true });
}
