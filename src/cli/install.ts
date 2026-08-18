import { existsSync, readFileSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { injectCommitTag, injectStatusRule } from "./agent-instructions.js";

export type InstallTarget = "cursor" | "opencode";

export const INSTALL_TARGETS: readonly InstallTarget[] = [
  "cursor",
  "opencode",
] as const;

/** The launch command specdive registers with the host. Overridable via env. */
function mcpCommand(): string[] {
  const env = process.env.SPECDIVE_CMD;
  if (env && env.trim().length > 0) {
    return env.trim().split(/\s+/);
  }
  return ["npx", "specdive", "mcp"];
}

interface TargetSpec {
  file: string;
  serverKey: (name: string) => string;
  rootKey: string;
  buildEntry: (cmd: string[]) => Record<string, unknown>;
}

/**
 * Per-target config shape for a LOCAL (stdio) MCP server. specdive only ever
 * installs locally — the host launches `specdive mcp` as a subprocess and
 * talks over stdin/stdout. No remote/url entries are produced by any target.
 */
function targetSpec(target: InstallTarget): TargetSpec {
  switch (target) {
    case "cursor":
      // Cursor: .cursor/mcp.json. A `command`+`args` entry is local stdio.
      return {
        file: join(".cursor", "mcp.json"),
        rootKey: "mcpServers",
        serverKey: (n) => n,
        buildEntry: (cmd) => ({ command: cmd[0], args: cmd.slice(1) }),
      };
    case "opencode":
      // OpenCode: opencode.json. `type: "local"` with the command as one array.
      return {
        file: "opencode.json",
        rootKey: "mcp",
        serverKey: (n) => n,
        buildEntry: (cmd) => ({ type: "local", command: cmd, enabled: true }),
      };
  }
}

/** Wires the specdive MCP server into the target host's config file and
 *  injects the Spec Status Decision Rule and commit-tag instruction into
 *  the host agent instruction file. */
export function installCommand(target: string): void {
  if (!isInstallTarget(target)) {
    throw new Error(
      `invalid --target: ${target} (expected: ${INSTALL_TARGETS.join(", ")})`,
    );
  }
  const spec = targetSpec(target);
  const filePath = spec.file;
  const cmd = mcpCommand();
  const entry = spec.buildEntry(cmd);

  const existing = readJson(filePath);
  const servers = (existing[spec.rootKey] as Record<string, unknown> | undefined) ?? {};
  // Deep-merge: keep user customizations on the specdive entry (env, enabled,
  // timeout, …) while ensuring the launch command stays correct. A plain
  // assignment would clobber a user's edits on re-install.
  servers["specdive"] = mergeEntry(
    servers["specdive"] as Record<string, unknown> | undefined,
    entry,
  );
  existing[spec.rootKey] = servers;

  writeJsonAtomic(filePath, existing);
  console.log(
    `[specdive] installed MCP server "specdive" into ${filePath} (target: ${target})`,
  );
  console.log(`[specdive] launch command: ${cmd.join(" ")}`);
  const rule = injectStatusRule();
  console.log(
    rule.injected
      ? `[specdive] injected status rule into ${rule.file}`
      : `[specdive] ${rule.file} already has a specdive status rule (left unchanged)`,
  );
  const commit = injectCommitTag();
  console.log(
    commit.injected
      ? `[specdive] injected commit-tag instruction into ${commit.file}`
      : `[specdive] ${commit.file} already has a specdive commit-tag instruction (left unchanged)`,
  );
}

/** Keys that must always match the current specdive launch config. */
const FORCED_KEYS = new Set(["command", "args", "type"]);

/**
 * Merges the canonical specdive entry onto an existing one. User-set keys
 * (env, enabled, timeout, cwd, …) are preserved; only the launch-command
 * keys (`command`, `args`, `type`) are forced so a stale command never
 * survives an install. On a fresh install the full canonical entry is used.
 */
function mergeEntry(
  current: Record<string, unknown> | undefined,
  canonical: Record<string, unknown>,
): Record<string, unknown> {
  if (!current) return canonical;
  const merged: Record<string, unknown> = { ...current };
  for (const [key, value] of Object.entries(canonical)) {
    // Forced keys always overwrite; user-set keys are left as-is.
    if (FORCED_KEYS.has(key) || !(key in merged)) {
      merged[key] = value;
    }
  }
  return merged;
}

function isInstallTarget(value: string): value is InstallTarget {
  return (INSTALL_TARGETS as readonly string[]).includes(value);
}

/** Returns the host config file path for a target (relative to cwd). */
export function targetFilePath(target: InstallTarget): string {
  return targetSpec(target).file;
}

/**
 * Reads a target's config and returns specdive's launch command as a single
 * array, or null if the config or specdive entry is absent. Normalizes the
 * two entry shapes (opencode's `command: string[]` vs cursor's
 * `command` + `args`) into one array.
 */
export function readSpecdiveCommand(target: InstallTarget): string[] | null {
  const spec = targetSpec(target);
  const cfg = readJson(spec.file);
  const block = (cfg[spec.rootKey] as Record<string, unknown> | undefined) ?? {};
  const entry = block.specdive as Record<string, unknown> | undefined;
  if (!entry) return null;
  const cmd = entry.command;
  if (Array.isArray(cmd)) return cmd as string[];
  if (typeof cmd === "string") {
    const args = Array.isArray(entry.args) ? (entry.args as string[]) : [];
    return [cmd, ...args];
  }
  return null;
}

/** Reads a JSON file as a plain object, or returns `{}` if absent/empty. */
function readJson(relPath: string): Record<string, unknown> {
  if (!existsSync(relPath)) return {};
  const text = readFileSync(relPath, "utf8").trim();
  if (text.length === 0) return {};
  return JSON.parse(text) as Record<string, unknown>;
}

/** Writes JSON pretty (2-space) via temp-then-rename for atomicity. */
function writeJsonAtomic(relPath: string, data: Record<string, unknown>): void {
  const json = JSON.stringify(data, null, 2) + "\n";
  const tmp = `${relPath}.${process.pid}.tmp`;
  mkdirIfNeeded(dirname(relPath));
  writeFileSync(tmp, json, "utf8");
  renameSync(tmp, relPath);
}

function mkdirIfNeeded(dir: string): void {
  if (dir && dir !== "." && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}
