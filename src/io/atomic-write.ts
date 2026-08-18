import { writeFileSync, renameSync, mkdirSync } from "node:fs";
import { dirname, join, basename as pathBasename } from "node:path";
import { randomBytes } from "node:crypto";
import type { WriteGuard } from "./write-guard.js";

/** Serializes JSON with sorted keys (for stable diffs) and a trailing newline. */
export function serializeJson(data: unknown): string {
  return JSON.stringify(data, sortKeysReplacer, 2) + "\n";
}

/**
 * Writes text to `specdiveDir/relativePath` atomically: write a hidden temp
 * file in the same directory, then rename. Same-directory rename is atomic
 * on POSIX; a cross-directory rename would not be. Target must pass the
 * write guard (`.specdive/` boundary).
 */
export function atomicWriteText(
  specdiveDir: string,
  relativePath: string,
  text: string,
  guard: WriteGuard,
): void {
  guard.assertWritable(relativePath);
  const targetPath = join(specdiveDir, relativePath);
  const tmpPath = makeTmpPath(targetPath);
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(tmpPath, text, "utf8");
  renameSync(tmpPath, targetPath);
}

/** Same as atomicWriteText, but serializes `data` as canonical JSON. */
export function atomicWriteJson(
  specdiveDir: string,
  relativePath: string,
  data: unknown,
  guard: WriteGuard,
): void {
  atomicWriteText(specdiveDir, relativePath, serializeJson(data), guard);
}

function makeTmpPath(targetPath: string): string {
  const dir = dirname(targetPath);
  const base = pathBasename(targetPath);
  return join(dir, `.${base}.${randomBytes(6).toString("hex")}.tmp`);
}

// Recursively sorts object keys for stable output. Array order is preserved
// (order is meaningful for source_files, depends_on, etc.).
function sortKeysReplacer(_key: string, value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const sorted: Record<string, unknown> = {};
    const record = value as Record<string, unknown>;
    for (const k of Object.keys(record).sort()) {
      sorted[k] = record[k];
    }
    return sorted;
  }
  return value;
}
