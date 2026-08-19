import type { CallToolResult, TextContent } from "@modelcontextprotocol/sdk/types.js";
import { getGuard, getSpecdiveDir, getUpdatedBy } from "./context.js";
import { initSpecdive, updateSpecdive } from "../scaffold.js";
import { injectCommitTag, injectPmSync, injectStatusRule } from "../cli/agent-instructions.js";
import { createSpec, updateStatus, logProgress } from "../specs/write.js";
import { tagCommit } from "../specs/tag-commit.js";
import { isInitialized, listSummaries } from "../specs/read.js";
import { normalizeStatus } from "../specs/ids.js";
import type { CreateSpecInput, Status, TagCommitInput } from "../specs/types.js";
import { VERSION } from "../version.js";

/** A successful tool result, JSON-encoded so the host can parse it. */
export function ok(data: unknown): CallToolResult {
  return { content: [text(JSON.stringify(data))] };
}

/** A structured tool error — the host assistant can react to `isError`. */
export function fail(message: string): CallToolResult {
  return { content: [text(message)], isError: true };
}

function text(t: string): TextContent {
  return { type: "text", text: t };
}

export interface HealthResult {
  initialized: boolean;
  name: string;
  ok: true;
  specdiveDir: string;
  version: string;
}

/** specdive_health: ping. Returns version and whether .specdive/ exists. */
export function handleHealth(): CallToolResult {
  return ok({
    initialized: isInitialized(getSpecdiveDir()),
    name: "specdive",
    ok: true,
    specdiveDir: getSpecdiveDir(),
    version: VERSION,
  } satisfies HealthResult);
}

/** specdive_init: create .specdive/ and return INSTRUCTIONS. Fails if it already exists. */
export function handleInit(): CallToolResult {
  try {
    const res = initSpecdive(process.cwd());
    return ok({ specdiveDir: res.specdiveDir, instructions: res.instructions });
  } catch (err) {
    return fail(messageOf(err));
  }
}

/** specdive_update: refresh INSTRUCTIONS.md and missing AGENTS.md blocks. */
export function handleUpdate(): CallToolResult {
  try {
    const res = updateSpecdive(process.cwd());
    injectStatusRule();
    injectCommitTag();
    injectPmSync();
    return ok({ specdiveDir: res.specdiveDir, instructions: res.instructions });
  } catch (err) {
    return fail(messageOf(err));
  }
}

/** specdive_create_spec: write one spec file, return its new id. */
export function handleCreateSpec(input: CreateSpecInput): CallToolResult {
  try {
    const id = createSpec(getSpecdiveDir(), input, getGuard(), getUpdatedBy());
    return ok({ id });
  } catch (err) {
    return fail(messageOf(err));
  }
}

/** specdive_update_status: change a spec's frontmatter status. */
export function handleUpdateStatus(id: string, status: string): CallToolResult {
  const normalized = normalizeStatus(status);
  if (normalized === null) {
    return fail(`invalid status: ${status} (done|backlog)`);
  }
  try {
    updateStatus(getSpecdiveDir(), id, normalized, getGuard(), getUpdatedBy());
    return ok({ id, status: normalized });
  } catch (err) {
    return fail(messageOf(err));
  }
}

/** specdive_log_progress: append a timestamped entry to a spec's Progress Log. */
export function handleLogProgress(id: string, note: string): CallToolResult {
  try {
    logProgress(getSpecdiveDir(), id, note, getGuard(), getUpdatedBy());
    return ok({ id, note });
  } catch (err) {
    return fail(messageOf(err));
  }
}

/** specdive_tag_commit: tag one git commit onto one or more specs. */
export function handleTagCommit(input: TagCommitInput): CallToolResult {
  try {
    const result = tagCommit(getSpecdiveDir(), input, getGuard(), getUpdatedBy());
    return ok(result);
  } catch (err) {
    return fail(messageOf(err));
  }
}

/** specdive_list_specs: return spec summaries, optionally filtered by status. */
export function handleListSpecs(status?: string): CallToolResult {
  let filter: Status | undefined;
  if (status !== undefined) {
    const normalized = normalizeStatus(status);
    if (normalized === null) {
      return fail(`invalid status filter: ${status} (done|backlog)`);
    }
    filter = normalized;
  }
  try {
    const specs = listSummaries(getSpecdiveDir(), filter);
    return ok({ specs });
  } catch (err) {
    return fail(messageOf(err));
  }
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
