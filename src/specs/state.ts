import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { atomicWriteJson } from "../io/atomic-write.js";
import { paths } from "../io/paths.js";
import type { WriteGuard } from "../io/write-guard.js";
import { readAllSummaries } from "./read.js";
import type { StateIndex } from "./types.js";

/**
 * Rebuilds `.specdive/state.json` from the current set of spec files.
 * `state.json` is a disposable derived cache — never a source of truth —
 * so it is fully overwritten from specs on every change.
 */
export function rebuildState(specdiveDir: string, guard: WriteGuard): void {
  const index: StateIndex = { specs: readAllSummaries(specdiveDir) };
  atomicWriteJson(specdiveDir, paths.stateJson, index, guard);
}

/** Loads the derived state index, or rebuilds it from specs if not present. */
export function loadState(specdiveDir: string): StateIndex {
  const file = join(specdiveDir, paths.stateJson);
  if (!existsSync(file)) return { specs: readAllSummaries(specdiveDir) };
  const text = readFileSync(file, "utf8");
  return JSON.parse(text) as StateIndex;
}
