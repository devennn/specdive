import { createInterface } from "node:readline/promises";
import { initSpecdive } from "../scaffold.js";
import { installCommand, INSTALL_TARGETS, type InstallTarget } from "./install.js";
import { EXIT_SUCCESS, EXIT_CONFIG } from "./exit-codes.js";

export interface InitOptions {
  /** Skip the interactive prompt and install for this target. */
  target?: string;
}

/**
 * `specdive init`: creates `.specdive/` (refuses if it already exists),
 * then wires the specdive MCP server into an AI assistant's config. The
 * target is chosen via an interactive prompt unless `--target` is given.
 */
export async function initCommand(opts: InitOptions): Promise<number> {
  try {
    const res = initSpecdive(process.cwd());
    console.log(`[specdive] created ${res.specdiveDir}`);
  } catch (err) {
    console.error(
      "[specdive]",
      err instanceof Error ? err.message : String(err),
    );
    return EXIT_CONFIG;
  }

  const target = await resolveTarget(opts);
  if (target === undefined) {
    printNextSteps(false);
    return EXIT_SUCCESS;
  }

  try {
    installCommand(target);
    printNextSteps(true, target);
    return EXIT_SUCCESS;
  } catch (err) {
    console.error(
      "[specdive]",
      err instanceof Error ? err.message : String(err),
    );
    return EXIT_CONFIG;
  }
}

/** Returns the chosen install target, or undefined to skip. */
async function resolveTarget(opts: InitOptions): Promise<InstallTarget | undefined> {
  if (opts.target) {
    if (!isInstallTarget(opts.target)) {
      throw new Error(
        `invalid --target: ${opts.target} (expected: ${INSTALL_TARGETS.join(", ")})`,
      );
    }
    return opts.target;
  }
  if (!process.stdin.isTTY) {
    console.log(
      "[specdive] non-interactive shell — skipping MCP install.",
      "Run `specdive install --target <target>` to wire it up.",
    );
    return undefined;
  }
  return promptTarget();
}

/** Prompts the user to pick an AI assistant to wire the MCP server into. */
async function promptTarget(): Promise<InstallTarget | undefined> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log("\nInstall the specdive MCP server for an AI assistant?");
    INSTALL_TARGETS.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
    console.log(`  ${INSTALL_TARGETS.length + 1}. Skip (install later with: specdive install --target <target>)`);

    const answer = await rl.question(`Choose [1-${INSTALL_TARGETS.length + 1}]: `);
    const n = parseInt(answer.trim(), 10);
    if (n >= 1 && n <= INSTALL_TARGETS.length) {
      return INSTALL_TARGETS[n - 1]!;
    }
    return undefined;
  } finally {
    rl.close();
  }
}

function isInstallTarget(value: string): value is InstallTarget {
  return (INSTALL_TARGETS as readonly string[]).includes(value);
}

function printNextSteps(installed: boolean, target?: string): void {
  console.log(`\n[specdive] next steps:`);
  if (installed && target) {
    console.log(`  1. Open ${target} in this repo.`);
    console.log(`  2. Ask it: "Initialize specdive for this codebase. Explore the`);
    console.log(`     repo, identify features a PM would recognize, and call`);
    console.log(`     specdive_create_spec for each with source_files."`);
  } else {
    console.log(`  1. Wire the MCP server:  specdive install --target <cursor|opencode>`);
    console.log(`  2. Ask your AI assistant to initialize specdive and create specs.`);
  }
  console.log(`  3. Run: specdive view   (open http://127.0.0.1:4747)`);
}
