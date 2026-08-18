import { createWriteGuard, type WriteGuard } from "../io/write-guard.js";
import { SPECDIVE_DIR } from "../io/paths.js";

/**
 * Resolves the `.specdive/` directory the MCP server writes into. It is
 * always `process.cwd()/.specdive` — the host assistant launches the MCP
 * server from the repo root, and specdive is deliberately cwd-bound and
 * git-free (no branch detection, no repo discovery).
 */
export function getSpecdiveDir(): string {
  return `${process.cwd()}/${SPECDIVE_DIR}`;
}

/** Creates the write guard bound to the current specdive dir. */
export function getGuard(): WriteGuard {
  return createWriteGuard(getSpecdiveDir());
}

/**
 * Who is writing. The host (Cursor/opencode) can identify
 * itself via SPECDIVE_UPDATED_BY; otherwise record a generic source so
 * the frontmatter `updated_by` field is never empty.
 */
export function getUpdatedBy(): string {
  return process.env.SPECDIVE_UPDATED_BY ?? "mcp";
}
