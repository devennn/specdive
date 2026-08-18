import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { COMMIT_TAG_MD, STATUS_RULE_MD } from "../specs/instructions.js";

export const STATUS_RULE_START = "<!-- specdive:status-rule -->";
export const STATUS_RULE_END = "<!-- /specdive:status-rule -->";
export const COMMIT_TAG_START = "<!-- specdive:commit-tag -->";
export const COMMIT_TAG_END = "<!-- /specdive:commit-tag -->";
export const AGENT_INSTRUCTION_FILE = "AGENTS.md";

export interface AgentBlockInjectResult {
  file: string;
  injected: boolean;
}

/**
 * Inserts the Spec Status Decision Rule into AGENTS.md if the marked
 * block is absent. Does not overwrite an existing block (user edits
 * persist). Returns whether a write happened.
 */
export function injectStatusRule(): AgentBlockInjectResult {
  return injectBlock(STATUS_RULE_START, statusRuleBlock());
}

/**
 * Inserts the commit-tagging instruction into AGENTS.md if the marked
 * block is absent. Does not overwrite an existing block. This is how
 * Cursor/OpenCode always see the rule in session context on commit.
 */
export function injectCommitTag(): AgentBlockInjectResult {
  return injectBlock(COMMIT_TAG_START, commitTagBlock());
}

function injectBlock(startMarker: string, block: string): AgentBlockInjectResult {
  const file = AGENT_INSTRUCTION_FILE;
  const existing = existsSync(file) ? readFileSync(file, "utf8") : "";
  if (existing.includes(startMarker)) {
    return { file, injected: false };
  }
  writeFileSync(file, appendBlock(existing, block), "utf8");
  return { file, injected: true };
}

function statusRuleBlock(): string {
  return markedBlock(
    STATUS_RULE_START,
    STATUS_RULE_END,
    STATUS_RULE_MD,
    "Edit this block to change how this project decides status. Re-install will not overwrite it.",
  );
}

function commitTagBlock(): string {
  return markedBlock(
    COMMIT_TAG_START,
    COMMIT_TAG_END,
    COMMIT_TAG_MD,
    "Edit this block to change how this project tags commits. Re-install will not overwrite it.",
  );
}

function markedBlock(
  start: string,
  end: string,
  body: string,
  footer: string,
): string {
  return [start, body, "", footer, end, ""].join("\n");
}

function appendBlock(existing: string, block: string): string {
  if (existing.length === 0) return block;
  const prefix = existing.endsWith("\n") ? existing : `${existing}\n`;
  return prefix.endsWith("\n\n") ? prefix + block : `${prefix}\n${block}`;
}
