import { test } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { serializeSpec, toFrontmatter } from "../src/specs/serialize.js";
import { parseSpec } from "../src/specs/parse.js";
import { createSpec, updateStatus, logProgress } from "../src/specs/write.js";
import { rebuildState, loadState } from "../src/specs/state.js";
import { readSpec, readAllSummaries } from "../src/specs/read.js";
import { initSpecdive, updateSpecdive } from "../src/scaffold.js";
import { createWriteGuard } from "../src/io/write-guard.js";
import { specFilePath } from "../src/io/paths.js";

function makeRepo(): string {
  return mkdtempSync(join(tmpdir(), "specdive-rt-"));
}

function fixtureSpec(): ReturnType<typeof Object> {
  const frontmatter = toFrontmatter({
    id: "FEAT-002",
    title: "OAuth login flow",
    status: "backlog",
    source_files: ["src/auth/oauth.ts", "src/auth/callback-handler.ts"],
    depends_on: ["FEAT-001"],
    commits: [],
    updated_by: "opencode",
    updated_at: "2026-08-13T10:22:00Z",
  });
  const body = [
    "## Summary",
    "Users can sign in with Google or GitHub.",
    "",
    "## Capabilities",
    "- OAuth via Google",
    "- OAuth via GitHub",
    "- Session cookie persists",
    "",
    "## Known Issues",
    "- No rate limiting on callback",
    "",
    "## Security Notes",
    "- client secret read from env",
    "",
    "## Open Questions",
    "- token refresh client or server?",
    "",
    "## Progress Log",
    "- 2026-08-13 (backfilled): observed working in oauth.ts",
    "",
  ].join("\n");
  return { frontmatter, body };
}

test("serialize → parse → serialize is byte-identical (in-memory round trip)", () => {
  const spec = fixtureSpec();
  const m1 = serializeSpec(spec);
  const reparsed = parseSpec(m1);
  const m2 = serializeSpec(reparsed);
  assert.equal(m2, m1, "re-serialization must be byte-identical");
});

test("frontmatter survives round trip with arrays and types intact", () => {
  const spec = fixtureSpec();
  const reparsed = parseSpec(serializeSpec(spec));
  assert.deepEqual(reparsed.frontmatter, spec.frontmatter);
  assert.equal(reparsed.body, spec.body);
});

test("createSpec writes a file that round-trips through read → serialize", () => {
  const repo = makeRepo();
  try {
    initSpecdive(repo);
    const guard = createWriteGuard(join(repo, ".specdive"));
    const specdiveDir = join(repo, ".specdive");

    const id = createSpec(
      specdiveDir,
      {
        title: "OAuth login flow",
        status: "backlog",
        content: fixtureSpec().body,
        source_files: ["src/auth/oauth.ts"],
        depends_on: ["FEAT-001"],
      },
      guard,
      "mcp",
    );
    assert.equal(id, "FEAT-001");

    const fileText = readFileSync(join(specdiveDir, specFilePath(id)), "utf8");
    const reparsed = parseSpec(fileText);
    // Re-serializing the parsed spec reproduces the on-disk bytes exactly.
    assert.equal(serializeSpec(reparsed), fileText);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test("updateStatus changes status and preserves the body verbatim", () => {
  const repo = makeRepo();
  try {
    initSpecdive(repo);
    const specdiveDir = join(repo, ".specdive");
    const guard = createWriteGuard(specdiveDir);

    const id = createSpec(
      specdiveDir,
      { title: "Dashboard", status: "backlog", content: "## Summary\nBuild it.\n" },
      guard,
      "mcp",
    );
    const before = readFileSync(join(specdiveDir, specFilePath(id)), "utf8");
    const beforeBody = parseSpec(before).body;

    updateStatus(specdiveDir, id, "done", guard, "mcp");

    const after = readFileSync(join(specdiveDir, specFilePath(id)), "utf8");
    const afterParsed = parseSpec(after);
    assert.equal(afterParsed.frontmatter.status, "done");
    assert.equal(afterParsed.body, beforeBody, "body must be untouched");
    assert.notEqual(after, before, "frontmatter must change");
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test("logProgress appends a timestamped entry and rebuilds state", () => {
  const repo = makeRepo();
  try {
    initSpecdive(repo);
    const specdiveDir = join(repo, ".specdive");
    const guard = createWriteGuard(specdiveDir);

    const id = createSpec(
      specdiveDir,
      {
        title: "Search",
        status: "backlog",
        content: "## Summary\nSearch stuff.\n\n## Progress Log\n- 2026-08-13 (backfilled): working\n",
      },
      guard,
      "mcp",
    );

    logProgress(specdiveDir, id, "wired the index", guard, "mcp");

    const spec = readSpec(specdiveDir, id);
    assert.match(spec.body, /- 2026-\d{2}-\d{2}: wired the index/);
    assert.match(spec.body, /\(backfilled\)/, "prior entry preserved");

    // state.json was rebuilt and now contains the one spec.
    assert.ok(existsSync(join(specdiveDir, "state.json")));
    const state = loadState(specdiveDir);
    assert.equal(state.specs.length, 1);
    assert.equal(state.specs[0]!.id, id);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test("initSpecdive refuses if .specdive/ exists; updateSpecdive refreshes INSTRUCTIONS only", () => {
  const repo = makeRepo();
  try {
    const first = initSpecdive(repo);
    const specdiveDir = first.specdiveDir;

    const guard = createWriteGuard(specdiveDir);
    createSpec(
      specdiveDir,
      { title: "Search", status: "backlog", content: "## Summary\nx\n" },
      guard,
      "mcp",
    );
    writeFileSync(join(specdiveDir, "config.yml"), 'project: "Acme"\n', "utf8");
    writeFileSync(join(specdiveDir, "INSTRUCTIONS.md"), "# stale\n", "utf8");

    assert.throws(() => initSpecdive(repo), /already exists/);

    const updated = updateSpecdive(repo);
    assert.equal(updated.specdiveDir, specdiveDir);
    assert.match(
      readFileSync(join(specdiveDir, "INSTRUCTIONS.md"), "utf8"),
      /Specdive instructions/,
    );
    assert.match(readFileSync(join(specdiveDir, "config.yml"), "utf8"), /Acme/);
    const specs = readAllSummaries(specdiveDir);
    assert.equal(specs.length, 1, "existing spec must survive update");
    assert.equal(specs[0]!.title, "Search");
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test("parseSpec coerces legacy status values to backlog", () => {
  const text = [
    "---",
    "id: FEAT-001",
    "title: Old",
    "status: in_progress",
    "source_files: []",
    "depends_on: []",
    "updated_by: mcp",
    "updated_at: '2026-08-14T00:00:00.000Z'",
    "---",
    "## Summary",
    "x",
    "",
  ].join("\n");
  assert.equal(parseSpec(text).frontmatter.status, "backlog");
});
