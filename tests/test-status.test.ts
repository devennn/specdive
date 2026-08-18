import { test } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkStatus } from "../src/cli/status.js";
import { installCommand } from "../src/cli/install.js";

function withRepo<T>(fn: (repo: string) => T | Promise<T>): T | Promise<T> {
  const repo = mkdtempSync(join(tmpdir(), "specdive-st-"));
  const originalCwd = process.cwd();
  process.chdir(repo);
  try {
    return fn(repo);
  } finally {
    process.chdir(originalCwd);
    rmSync(repo, { recursive: true, force: true });
  }
}

test("checkStatus returns no targets when no MCP config exists", async () => {
  await withRepo(async () => {
    const result = await checkStatus();
    assert.equal(result.targets.length, 0);
  });
});

test("checkStatus reports a target as installed after installCommand", async () => {
  await withRepo(async () => {
    installCommand("opencode");
    const result = await checkStatus();
    assert.equal(result.targets.length, 1);
    const t = result.targets[0]!;
    assert.equal(t.target, "opencode");
    assert.equal(t.installed, true);
    assert.deepEqual(t.command, ["npx", "specdive", "mcp"]);
    // `npx` ships with node, so the launch command should resolve.
    assert.equal(t.commandResolves, true);
    // reachable is environment-dependent (needs `opencode` on PATH); only
    // assert it's a boolean, not its value, to keep the test portable.
    assert.equal(typeof t.reachable, "boolean");
  });
});

test("checkStatus picks up multiple installed targets", async () => {
  await withRepo(async () => {
    installCommand("opencode");
    installCommand("cursor");
    const result = await checkStatus();
    const names = result.targets.map((t) => t.target).sort();
    assert.deepEqual(names, ["cursor", "opencode"]);
  });
});

test("checkStatus ignores a config file with no specdive entry", async () => {
  await withRepo(async () => {
    mkdirSync(".cursor", { recursive: true });
    writeFileSync(
      join(".cursor", "mcp.json"),
      JSON.stringify({ mcpServers: { other: { command: "x", args: [] } } }) + "\n",
    );
    const result = await checkStatus();
    assert.equal(result.targets.length, 0, "non-specdive config is ignored");
  });
});
