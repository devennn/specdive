#!/usr/bin/env node

import { Command } from "commander";
import { installCommand, INSTALL_TARGETS } from "./cli/install.js";
import { initCommand } from "./cli/init.js";
import { updateCommand } from "./cli/update.js";
import { viewCommand } from "./cli/view.js";
import { runMcpServer } from "./mcp/server.js";
import { VERSION } from "./version.js";
import {
  EXIT_SUCCESS,
  EXIT_UNEXPECTED,
  EXIT_CONFIG,
} from "./cli/exit-codes.js";

const DEFAULT_PORT = 4747;
const DEFAULT_HOST = "127.0.0.1";

async function main(): Promise<number> {
  const program = new Command()
    .name("specdive")
    .description("AI-native project management: MCP spec tools + PM webpage")
    .version(VERSION)
    .exitOverride();

  program
    .command("init")
    .description("Create .specdive/ and wire the MCP server into an AI assistant")
    .option("-t, --target <target>", `install MCP for: ${INSTALL_TARGETS.join(", ")} (skip prompt)`)
    .action(async (opts) => {
      try {
        const code = await initCommand({ target: opts.target });
        process.exitCode = code;
      } catch (err) {
        console.error(
          "[specdive]",
          err instanceof Error ? err.message : String(err),
        );
        process.exitCode = EXIT_CONFIG;
      }
    });

  program
    .command("update")
    .description("Refresh INSTRUCTIONS.md and missing AGENTS.md blocks (does not touch specs or config)")
    .action(() => {
      process.exitCode = updateCommand();
    });

  program
    .command("install")
    .description("Wire the specdive MCP server into a host's config")
    .requiredOption(
      `-t, --target <${INSTALL_TARGETS.join("|")}>`,
      `one of: ${INSTALL_TARGETS.join(", ")}`,
    )
    .action((opts) => {
      try {
        installCommand(opts.target);
      } catch (err) {
        console.error(
          "[specdive]",
          err instanceof Error ? err.message : String(err),
        );
        process.exitCode = EXIT_CONFIG;
      }
    });

  program
    .command("view")
    .description("Start the local PM webpage")
    .option("-p, --port <port>", "port", String(DEFAULT_PORT))
    .option("-H, --host <host>", "host", DEFAULT_HOST)
    .action(async (opts) => {
      const port = parseInt(opts.port, 10);
      const code = await viewCommand({ port, host: opts.host });
      process.exitCode = code;
    });

  program
    .command("mcp")
    .description("Run the specdive MCP server over stdio")
    .action(async () => {
      try {
        await runMcpServer();
      } catch (err) {
        console.error(
          "[specdive] Unexpected error",
          err instanceof Error ? err.message : String(err),
        );
        process.exitCode = EXIT_UNEXPECTED;
      }
    });

  try {
    await program.parseAsync(process.argv);
    return Number(process.exitCode ?? EXIT_SUCCESS);
  } catch (err) {
    if (err instanceof Error && err.name === "CommanderError") {
      // --help/--version or usage error: commander already printed a message.
      return EXIT_CONFIG;
    }
    console.error(
      "[specdive] Unexpected error",
      err instanceof Error ? err.message : String(err),
    );
    return EXIT_UNEXPECTED;
  }
}

main().then((code) => {
  // Only exit explicitly for non-success; long-running commands (view, mcp)
  // keep the process alive via their own listeners.
  if (code !== EXIT_SUCCESS) process.exit(code);
});
