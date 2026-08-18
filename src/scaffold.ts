import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createWriteGuard } from "./io/write-guard.js";
import { atomicWriteText } from "./io/atomic-write.js";
import { paths, SPECDIVE_DIR } from "./io/paths.js";
import { rebuildState } from "./specs/state.js";
import {
  INSTRUCTIONS_MD,
  CONFIG_YML,
} from "./specs/instructions.js";

export interface ScaffoldResult {
  specdiveDir: string;
  instructions: string;
}

export class AlreadyInitializedError extends Error {
  constructor(specdiveDir: string) {
    super(
      `.specdive/ already exists at ${specdiveDir}. Run \`specdive update\` to refresh INSTRUCTIONS.md.`,
    );
    this.name = "AlreadyInitializedError";
  }
}

export class NotInitializedError extends Error {
  constructor(specdiveDir: string) {
    super(
      `.specdive/ not found at ${specdiveDir}. Run \`specdive init\` first.`,
    );
    this.name = "NotInitializedError";
  }
}

/**
 * Creates `.specdive/` (config, INSTRUCTIONS.md, specs/) and rebuilds
 * `state.json`. Refuses if `.specdive/` already exists — use
 * `updateSpecdive` to refresh INSTRUCTIONS.md without touching user data.
 * Does not write `.gitignore`.
 */
export function initSpecdive(repoRoot: string): ScaffoldResult {
  const specdiveDir = join(repoRoot, SPECDIVE_DIR);
  if (existsSync(specdiveDir)) {
    throw new AlreadyInitializedError(specdiveDir);
  }

  mkdirSync(join(specdiveDir, paths.specsDir), { recursive: true });
  const guard = createWriteGuard(specdiveDir);
  atomicWriteText(specdiveDir, paths.config, CONFIG_YML, guard);
  atomicWriteText(specdiveDir, paths.instructions, INSTRUCTIONS_MD, guard);
  rebuildState(specdiveDir, guard);

  return { specdiveDir, instructions: INSTRUCTIONS_MD };
}

/**
 * Rewrites specdive-owned `INSTRUCTIONS.md` to the current contract.
 * Does not touch `config.yml` or specs. Fails if `.specdive/` is absent.
 */
export function updateSpecdive(repoRoot: string): ScaffoldResult {
  const specdiveDir = join(repoRoot, SPECDIVE_DIR);
  if (!existsSync(specdiveDir)) {
    throw new NotInitializedError(specdiveDir);
  }

  const guard = createWriteGuard(specdiveDir);
  atomicWriteText(specdiveDir, paths.instructions, INSTRUCTIONS_MD, guard);
  return { specdiveDir, instructions: INSTRUCTIONS_MD };
}
