import { join } from "node:path";

/** The specdive state directory name, created at the repo root. */
export const SPECDIVE_DIR = ".specdive";

/**
 * Canonical relative paths inside `.specdive/`. All writes are computed
 * relative to the specdive dir and pass through the write guard, so these
 * never escape the boundary.
 */
export const paths = {
  config: "config.yml",
  instructions: "INSTRUCTIONS.md",

  specsDir: "specs",
  stateJson: "state.json",
} as const;

/** Files at the `.specdive/` root the write guard refuses to overwrite. */
export const specdiveRoots = [".env", ".env.example"] as const;

/** Relative path of a spec markdown file for a given id, e.g. `specs/FEAT-003.md`. */
export function specFilePath(id: string): string {
  return join(paths.specsDir, `${id}.md`);
}
