import { test } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  handleHealth,
  handleInit,
  handleUpdate,
  handleCreateSpec,
  handleListSpecs,
  handleUpdateStatus,
  handleLogProgress,
  handleTagCommit,
} from "../src/mcp/handlers.js";
import { VERSION } from "../src/version.js";
import { readSpec } from "../src/specs/read.js";

/** Patches process.cwd to a temp repo so the cwd-bound handlers operate there. */
function withRepo<T>(fn: (repo: string) => T): T {
  const repo = mkdtempSync(join(tmpdir(), "specdive-mcp-"));
  const originalCwd = process.cwd();
  process.chdir(repo);
  try {
    return fn(repo);
  } finally {
    process.chdir(originalCwd);
    rmSync(repo, { recursive: true, force: true });
  }
}

function text(r: { content: { text: string }[] }): string {
  return r.content[0]!.text;
}

function parse<T>(r: { content: { text: string }[] }): T {
  return JSON.parse(text(r)) as T;
}

test("specdive_health reports version and initialized before and after init", () => {
  withRepo(() => {
    const before = handleHealth();
    assert.equal(before.isError, undefined, text(before));
    const cold = parse<{
      initialized: boolean;
      name: string;
      ok: boolean;
      specdiveDir: string;
      version: string;
    }>(before);
    assert.equal(cold.ok, true);
    assert.equal(cold.name, "specdive");
    assert.equal(cold.version, VERSION);
    assert.equal(cold.initialized, false);
    assert.equal(cold.specdiveDir, join(process.cwd(), ".specdive"));

    handleInit();
    const after = parse<{ initialized: boolean }>(handleHealth());
    assert.equal(after.initialized, true);
  });
});

test("init → create → list → update → log flow over the MCP handlers", () => {
  withRepo(() => {
    const init = handleInit();
    assert.equal(init.isError, undefined, text(init));
    const initPayload = parse<{ instructions: string }>(init);
    assert.ok(initPayload.instructions.includes("Specdive instructions"));
    assert.ok(initPayload.instructions.includes("primary specs management"));
    assert.ok(initPayload.instructions.includes("Spec Status Decision Rule"));
    assert.equal(existsSync("AGENTS.md"), false, "MCP init has no provider — no host file");

    const again = handleInit();
    assert.equal(again.isError, true);
    assert.match(text(again), /already exists/);

    const created = handleCreateSpec({
      title: "OAuth login flow",
      status: "backlog",
      content: "## Summary\nSign in with Google.\n\n## Progress Log\n- 2026-08-13 (backfilled): observed\n",
      source_files: ["src/auth/oauth.ts"],
      depends_on: [],
    });
    const { id } = parse<{ id: string }>(created);
    assert.equal(id, "FEAT-001");

    const listed = handleListSpecs();
    const list = parse<{ specs: { id: string; status: string }[] }>(listed);
    assert.equal(list.specs.length, 1);
    assert.equal(list.specs[0]!.status, "backlog");

    const filtered = handleListSpecs("done");
    assert.equal(parse<{ specs: unknown[] }>(filtered).specs.length, 0);

    const updated = handleUpdateStatus("FEAT-001", "done");
    assert.equal(updated.isError, undefined);
    assert.equal(readSpec(join(process.cwd(), ".specdive"), "FEAT-001").frontmatter.status, "done");

    const logged = handleLogProgress("FEAT-001", "shipped OAuth");
    assert.equal(logged.isError, undefined);
    const spec = readSpec(join(process.cwd(), ".specdive"), "FEAT-001");
    assert.match(spec.body, /shipped OAuth/);
    assert.match(spec.body, /\(backfilled\)/, "backfilled entry preserved");

    const tagged = handleTagCommit({
      sha: "a1b2c3d",
      message: "ship OAuth login",
      ids: ["FEAT-001"],
    });
    assert.equal(tagged.isError, undefined, text(tagged));
    const afterTag = readSpec(join(process.cwd(), ".specdive"), "FEAT-001");
    assert.equal(afterTag.frontmatter.commits.length, 1);
    assert.equal(afterTag.frontmatter.commits[0]!.sha, "a1b2c3d");
  });
});

test("handlers return structured errors for bad inputs", () => {
  withRepo(() => {
    handleInit();
    const badStatus = handleUpdateStatus("FEAT-001", "complete");
    assert.equal(badStatus.isError, true);
    assert.match(text(badStatus), /invalid status/);

    const missing = handleLogProgress("FEAT-999", "x");
    assert.equal(missing.isError, true);
    assert.match(text(missing), /FEAT-999/i);

    const badSha = handleTagCommit({ sha: "not-a-sha", message: "x", ids: ["FEAT-001"] });
    assert.equal(badSha.isError, true);
    assert.match(text(badSha), /invalid sha/);
  });
});

test("CLI init --target opencode scaffolds .specdive/ and writes the host config", async () => {
  await withRepoAsync(async () => {
    const { initCommand } = await import("../src/cli/init.js");
    const { existsSync, readFileSync } = await import("node:fs");
    const code = await initCommand({ target: "opencode" });
    assert.equal(code, 0);
    assert.ok(existsSync(".specdive/specs"), ".specdive/ was created");
    assert.ok(existsSync("opencode.json"), "host config was written");
    const cfg = JSON.parse(readFileSync("opencode.json", "utf8")) as {
      mcp: { specdive: { type: string } };
    };
    assert.equal(cfg.mcp.specdive.type, "local", "install must be local-only");
    assert.ok(existsSync("AGENTS.md"), "status rule injected for opencode");
    assert.match(readFileSync("AGENTS.md", "utf8"), /specdive:status-rule/);
    assert.match(readFileSync("AGENTS.md", "utf8"), /specdive:commit-tag/);
  });
});

test("CLI update refreshes INSTRUCTIONS without touching config", async () => {
  await withRepoAsync(async () => {
    const { initCommand } = await import("../src/cli/init.js");
    const { updateCommand } = await import("../src/cli/update.js");
    const { writeFileSync, readFileSync } = await import("node:fs");
    assert.equal(await initCommand({ target: "opencode" }), 0);
    writeFileSync(".specdive/config.yml", 'project: "Acme"\n');
    writeFileSync(".specdive/INSTRUCTIONS.md", "# stale\n");
    assert.equal(updateCommand(), 0);
    assert.match(readFileSync(".specdive/INSTRUCTIONS.md", "utf8"), /Specdive instructions/);
    assert.match(readFileSync(".specdive/config.yml", "utf8"), /Acme/);
  });
});

test("CLI init refuses when .specdive/ already exists", async () => {
  await withRepoAsync(async () => {
    const { initCommand } = await import("../src/cli/init.js");
    assert.equal(await initCommand({ target: "opencode" }), 0);
    assert.equal(await initCommand({ target: "opencode" }), 2);
  });
});

test("MCP specdive_update refreshes INSTRUCTIONS and injects AGENTS.md", () => {
  withRepo(() => {
    const missing = handleUpdate();
    assert.equal(missing.isError, true);
    assert.match(text(missing), /not found/);

    handleInit();
    const updated = handleUpdate();
    assert.equal(updated.isError, undefined, text(updated));
    const payload = parse<{ instructions: string }>(updated);
    assert.ok(payload.instructions.includes("Specdive instructions"));
    assert.ok(existsSync("AGENTS.md"));
    assert.match(readFileSync("AGENTS.md", "utf8"), /specdive:commit-tag/);
  });
});

async function withRepoAsync<T>(fn: () => Promise<T>): Promise<T> {
  const repo = mkdtempSync(join(tmpdir(), "specdive-cli-"));
  const originalCwd = process.cwd();
  process.chdir(repo);
  try {
    return await fn();
  } finally {
    process.chdir(originalCwd);
    rmSync(repo, { recursive: true, force: true });
  }
}
