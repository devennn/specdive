import { resolve, relative, isAbsolute, join } from "node:path";
import { specdiveRoots } from "./paths.js";

export class WriteBoundaryError extends Error {
  constructor(path: string, reason: string) {
    super(`Refusing to write outside .specdive/: ${path} (${reason})`);
    this.name = "WriteBoundaryError";
  }
}

export interface WriteGuard {
  /** Absolute, resolved `.specdive/` dir this guard is bound to. */
  readonly specdiveDir: string;
  /** Throws WriteBoundaryError if a target resolves outside the boundary or hits a protected file. */
  assertWritable(targetPath: string): void;
}

/**
 * Creates a guard bound to one `.specdive/` directory. Every write in
 * specdive passes its target through `assertWritable` first — this is the
 * single chokepoint that enforces the write-side-only trust model.
 */
export function createWriteGuard(specdiveDir: string): WriteGuard {
  const normalizedSpecdiveDir = resolve(specdiveDir);

  return {
    specdiveDir: normalizedSpecdiveDir,

    assertWritable(targetPath: string): void {
      // Relative paths are interpreted as under .specdive/.
      const absTarget = isAbsolute(targetPath)
        ? resolve(targetPath)
        : resolve(normalizedSpecdiveDir, targetPath);

      // Path relative to .specdive/. A leading ".." or an absolute result
      // means the target escapes the boundary — refuse.
      const rel = relative(normalizedSpecdiveDir, absTarget);
      if (rel === "" ? false : rel.startsWith("..") || isAbsolute(rel)) {
        throw new WriteBoundaryError(targetPath, "outside .specdive/");
      }

      // Even inside .specdive/, protected root files (secrets) are off-limits.
      for (const forbidden of specdiveRoots) {
        if (absTarget === join(normalizedSpecdiveDir, forbidden)) {
          throw new WriteBoundaryError(targetPath, `protected: ${forbidden}`);
        }
      }
    },
  };
}
