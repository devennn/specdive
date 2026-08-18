import { injectCommitTag, injectStatusRule } from "./agent-instructions.js";
import { updateSpecdive } from "../scaffold.js";
import { EXIT_SUCCESS, EXIT_CONFIG } from "./exit-codes.js";

/**
 * `specdive update`: refresh INSTRUCTIONS.md and inject missing AGENTS.md
 * blocks. Does not touch config.yml, specs, or the host MCP config.
 */
export function updateCommand(): number {
  try {
    const res = updateSpecdive(process.cwd());
    console.log(`[specdive] refreshed ${res.specdiveDir}/INSTRUCTIONS.md`);
    logInject(injectStatusRule(), "status rule");
    logInject(injectCommitTag(), "commit-tag instruction");
    return EXIT_SUCCESS;
  } catch (err) {
    console.error(
      "[specdive]",
      err instanceof Error ? err.message : String(err),
    );
    return EXIT_CONFIG;
  }
}

function logInject(
  result: { file: string; injected: boolean },
  label: string,
): void {
  console.log(
    result.injected
      ? `[specdive] injected ${label} into ${result.file}`
      : `[specdive] ${result.file} already has a specdive ${label} (left unchanged)`,
  );
}
