import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";
import {
  INSTALL_TARGETS,
  type InstallTarget,
  readSpecdiveCommand,
} from "./install.js";

const execFileP = promisify(execFile);

/** The binary each assistant installs, used for the `--version` reachability check. */
const ASSISTANT_BIN: Record<InstallTarget, string> = {
  opencode: "opencode",
  cursor: "cursor",
};

export interface TargetStatus {
  target: InstallTarget;
  /** Config file exists and contains a specdive entry. */
  installed: boolean;
  /** The launch command's binary is findable on this machine. */
  commandResolves: boolean;
  /** `<assistant> --version` runs and exits 0. */
  reachable: boolean;
  /** The registered launch command, if installed. */
  command: string[] | null;
}

export interface StatusResult {
  targets: TargetStatus[];
}

/**
 * Checks MCP install + assistant reachability for every supported target that
 * has a specdive entry in its config. Spawns short-lived subprocesses
 * (`which`, `<assistant> --version`) with timeouts so a hung binary can't
 * block the view.
 */
export async function checkStatus(): Promise<StatusResult> {
  const targets: TargetStatus[] = [];
  for (const target of INSTALL_TARGETS) {
    const command = readSpecdiveCommand(target);
    if (!command) continue; // not installed for this target
    const commandResolves = await binaryResolves(command[0] ?? "");
    const reachable = await assistantReachable(target);
    targets.push({
      target,
      installed: true,
      commandResolves,
      reachable,
      command,
    });
  }
  return { targets };
}

/** True if `bin` is on PATH or is an existing absolute/relative file path. */
async function binaryResolves(bin: string): Promise<boolean> {
  if (bin.length === 0) return false;
  if (bin.includes("/") && existsSync(bin)) return true;
  const cmd = process.platform === "win32" ? "where" : "which";
  try {
    await execFileP(cmd, [bin], { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/** True if the assistant's `--version` command exits 0 within 3s. */
async function assistantReachable(target: InstallTarget): Promise<boolean> {
  const bin = ASSISTANT_BIN[target];
  try {
    await execFileP(bin, ["--version"], { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}
