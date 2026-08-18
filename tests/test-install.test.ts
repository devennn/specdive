import { test } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { installCommand } from "../src/cli/install.js";

function withRepo<T>(fn: (repo: string) => T): T {
  const repo = mkdtempSync(join(tmpdir(), "specdive-inst-"));
  const originalCwd = process.cwd();
  process.chdir(repo);
  try {
    return fn(repo);
  } finally {
    process.chdir(originalCwd);
    rmSync(repo, { recursive: true, force: true });
  }
}

function readJson(file: string): Record<string, unknown> {
  return JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
}

function specdiveEntry(file: string): Record<string, unknown> {
  const cfg = readJson(file);
  const block = (cfg.mcpServers ?? cfg.mcp) as Record<string, unknown>;
  return block.specdive as Record<string, unknown>;
}

function setSpecdive(file: string, patch: Record<string, unknown>): void {
  const cfg = readJson(file);
  const rootKey = cfg.mcpServers ? "mcpServers" : "mcp";
  const block = cfg[rootKey] as Record<string, Record<string, unknown>>;
  block.specdive = { ...block.specdive, ...patch };
  writeFileSync(file, JSON.stringify(cfg, null, 2) + "\n");
}

test("install does not write or change .gitignore", () => {
  withRepo(() => {
    installCommand("opencode");
    assert.equal(existsSync(".gitignore"), false);
  });
});

test("install leaves an existing .gitignore untouched", () => {
  withRepo(() => {
    writeFileSync(".gitignore", "node_modules/\n.DS_Store\n", "utf8");
    installCommand("cursor");
    assert.equal(readFileSync(".gitignore", "utf8"), "node_modules/\n.DS_Store\n");
  });
});

test("re-install preserves user customizations (enabled, environment)", () => {
  withRepo(() => {
    installCommand("opencode");
    // Fresh install enables specdive.
    assert.equal(specdiveEntry("opencode.json").enabled, true);

    // User disables it and adds an env var.
    setSpecdive("opencode.json", { enabled: false, environment: { FOO: "bar" } });

    installCommand("opencode");
    const entry = specdiveEntry("opencode.json");
    assert.equal(entry.enabled, false, "user's enabled=false must be preserved");
    assert.deepEqual(entry.environment, { FOO: "bar" }, "user env must be preserved");
  });
});

test("re-install forces the launch command back to current (stale command clobbered)", () => {
  withRepo(() => {
    installCommand("cursor");
    // Simulate a stale command from an old specdive install.
    setSpecdive(".cursor/mcp.json", { command: "node", args: ["/old/index.js", "mcp"] });

    installCommand("cursor");
    const entry = specdiveEntry(".cursor/mcp.json");
    assert.equal(entry.command, "npx", "stale command must be forced back");
    assert.deepEqual(entry.args, ["specdive", "mcp"], "stale args must be forced back");
  });
});

test("install injects the status rule and commit-tag instruction into AGENTS.md", () => {
  withRepo(() => {
    installCommand("cursor");
    const agents = readFileSync("AGENTS.md", "utf8");
    assert.match(agents, /<!-- specdive:status-rule -->/);
    assert.match(agents, /Spec Status Decision Rule/);
    assert.match(agents, /<!-- \/specdive:status-rule -->/);
    assert.match(agents, /<!-- specdive:commit-tag -->/);
    assert.match(agents, /specdive_tag_commit/);
    assert.match(agents, /<!-- \/specdive:commit-tag -->/);
  });
});

test("install appends the status rule to an existing AGENTS.md", () => {
  withRepo(() => {
    writeFileSync("AGENTS.md", "# Project agents\n\nDo not break the build.\n", "utf8");
    installCommand("opencode");
    const agents = readFileSync("AGENTS.md", "utf8");
    assert.match(agents, /Do not break the build/);
    assert.match(agents, /<!-- specdive:status-rule -->/);
    assert.match(agents, /<!-- specdive:commit-tag -->/);
  });
});

test("re-install does not overwrite a user-edited status rule block", () => {
  withRepo(() => {
    installCommand("cursor");
    writeFileSync(
      "AGENTS.md",
      [
        "<!-- specdive:status-rule -->",
        "## Spec Status Decision Rule",
        "Custom: only mark done after a demo.",
        "<!-- /specdive:status-rule -->",
        "",
      ].join("\n"),
      "utf8",
    );
    installCommand("cursor");
    const agents = readFileSync("AGENTS.md", "utf8");
    assert.match(agents, /Custom: only mark done after a demo/);
    const starts = agents.match(/<!-- specdive:status-rule -->/g) ?? [];
    assert.equal(starts.length, 1, "must not duplicate the block");
  });
});

test("re-install adds commit-tag when only the status rule is present", () => {
  withRepo(() => {
    writeFileSync(
      "AGENTS.md",
      [
        "<!-- specdive:status-rule -->",
        "## Spec Status Decision Rule",
        "Custom: only mark done after a demo.",
        "<!-- /specdive:status-rule -->",
        "",
      ].join("\n"),
      "utf8",
    );
    installCommand("cursor");
    const agents = readFileSync("AGENTS.md", "utf8");
    assert.match(agents, /Custom: only mark done after a demo/);
    assert.match(agents, /<!-- specdive:commit-tag -->/);
    assert.match(agents, /specdive_tag_commit/);
  });
});

test("re-install does not overwrite a user-edited commit-tag block", () => {
  withRepo(() => {
    installCommand("cursor");
    writeFileSync(
      "AGENTS.md",
      [
        "<!-- specdive:commit-tag -->",
        "## Specdive commit tagging",
        "Custom: tag only FEAT-001.",
        "<!-- /specdive:commit-tag -->",
        "",
      ].join("\n"),
      "utf8",
    );
    installCommand("cursor");
    const agents = readFileSync("AGENTS.md", "utf8");
    assert.match(agents, /Custom: tag only FEAT-001/);
    const starts = agents.match(/<!-- specdive:commit-tag -->/g) ?? [];
    assert.equal(starts.length, 1, "must not duplicate the block");
  });
});

test("install merges, never replaces — other MCP servers survive", () => {
  withRepo(() => {
    writeFileSync(
      "opencode.json",
      JSON.stringify({
        $schema: "x",
        mcp: { other: { type: "local", command: ["other"] } },
        model: "x/y",
      }) + "\n",
    );
    installCommand("opencode");
    const cfg = readJson("opencode.json");
    const mcp = cfg.mcp as Record<string, unknown>;
    assert.ok(mcp.other, "other server preserved");
    assert.ok(mcp.specdive, "specdive added");
    assert.equal(cfg.$schema, "x", "top-level keys preserved");
    assert.equal(cfg.model, "x/y");
  });
});
