import { test } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initSpecdive } from "../src/scaffold.js";
import { createSpec } from "../src/specs/write.js";
import { tagCommit } from "../src/specs/tag-commit.js";
import { readSpec } from "../src/specs/read.js";
import { parseSpec } from "../src/specs/parse.js";
import { serializeSpec } from "../src/specs/serialize.js";
import { specFilePath } from "../src/io/paths.js";
import { atomicWriteText } from "../src/io/atomic-write.js";
import { createWriteGuard } from "../src/io/write-guard.js";

function makeRepo(): string {
  return mkdtempSync(join(tmpdir(), "specdive-tag-"));
}

function withRepo<T>(fn: (specdiveDir: string) => T): T {
  const repo = makeRepo();
  try {
    initSpecdive(repo);
    return fn(join(repo, ".specdive"));
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
}

const SHA = "a1b2c3d4e5f6789012345678901234567890abcd";

test("tagCommit writes the same SHA onto multiple specs", () => {
  withRepo((specdiveDir) => {
    const guard = createWriteGuard(specdiveDir);
    const a = createSpec(
      specdiveDir,
      { title: "Auth", status: "backlog", content: "## Summary\na\n" },
      guard,
      "mcp",
    );
    const b = createSpec(
      specdiveDir,
      { title: "Dashboard", status: "done", content: "## Summary\nb\n" },
      guard,
      "mcp",
    );

    const result = tagCommit(
      specdiveDir,
      { sha: SHA, message: "wire oauth into dashboard", ids: [a, b] },
      guard,
      "mcp",
    );
    assert.deepEqual(result.tagged, [a, b]);
    assert.deepEqual(result.already_tagged, []);
    assert.equal(result.sha, SHA);

    const specA = readSpec(specdiveDir, a);
    const specB = readSpec(specdiveDir, b);
    const commit = specA.frontmatter.commits[0]!;
    assert.equal(commit.sha, SHA);
    assert.equal(commit.message, "wire oauth into dashboard");
    assert.equal(commit.author, "mcp");
    assert.ok(commit.committed_at);
    assert.deepEqual(specB.frontmatter.commits, specA.frontmatter.commits);
  });
});

test("tagCommit is idempotent for the same SHA on the same spec", () => {
  withRepo((specdiveDir) => {
    const guard = createWriteGuard(specdiveDir);
    const id = createSpec(
      specdiveDir,
      { title: "Auth", status: "backlog", content: "## Summary\na\n" },
      guard,
      "mcp",
    );
    tagCommit(specdiveDir, { sha: SHA, message: "first", ids: [id] }, guard, "mcp");
    const again = tagCommit(
      specdiveDir,
      { sha: SHA.toUpperCase(), message: "ignored", ids: [id] },
      guard,
      "mcp",
    );
    assert.deepEqual(again.tagged, []);
    assert.deepEqual(again.already_tagged, [id]);
    assert.equal(readSpec(specdiveDir, id).frontmatter.commits.length, 1);
    assert.equal(readSpec(specdiveDir, id).frontmatter.commits[0]!.message, "first");
  });
});

test("tagCommit fills missing author and committed_at on re-tag", () => {
  withRepo((specdiveDir) => {
    const guard = createWriteGuard(specdiveDir);
    const id = createSpec(
      specdiveDir,
      { title: "Auth", status: "backlog", content: "## Summary\na\n" },
      guard,
      "mcp",
    );
    tagCommit(specdiveDir, { sha: SHA, message: "first", ids: [id] }, guard, "mcp");
    const spec = readSpec(specdiveDir, id);
    delete spec.frontmatter.commits[0]!.author;
    delete spec.frontmatter.commits[0]!.committed_at;
    atomicWriteText(specdiveDir, specFilePath(id), serializeSpec(spec), guard);

    const filled = tagCommit(
      specdiveDir,
      {
        sha: SHA,
        message: "ignored",
        ids: [id],
        author: "Deven",
        committed_at: "2026-08-18T02:39:52.000Z",
      },
      guard,
      "cursor",
    );
    assert.deepEqual(filled.tagged, [id]);
    assert.deepEqual(filled.already_tagged, []);
    const commit = readSpec(specdiveDir, id).frontmatter.commits[0]!;
    assert.equal(commit.message, "first");
    assert.equal(commit.author, "Deven");
    assert.equal(commit.committed_at, "2026-08-18T02:39:52.000Z");
  });
});

test("tagCommit stores agent-supplied author and committed_at", () => {
  withRepo((specdiveDir) => {
    const guard = createWriteGuard(specdiveDir);
    const id = createSpec(
      specdiveDir,
      { title: "Auth", status: "backlog", content: "## Summary\na\n" },
      guard,
      "mcp",
    );
    tagCommit(
      specdiveDir,
      {
        sha: SHA,
        message: "from git",
        ids: [id],
        author: "devennn",
        committed_at: "2026-08-18T03:00:00.000Z",
      },
      guard,
      "mcp",
    );
    const commit = readSpec(specdiveDir, id).frontmatter.commits[0]!;
    assert.equal(commit.author, "devennn");
    assert.equal(commit.committed_at, "2026-08-18T03:00:00.000Z");
  });
});

test("tagCommit rejects a bad SHA, empty ids, and a missing spec", () => {
  withRepo((specdiveDir) => {
    const guard = createWriteGuard(specdiveDir);
    const id = createSpec(
      specdiveDir,
      { title: "Auth", status: "backlog", content: "## Summary\na\n" },
      guard,
      "mcp",
    );
    assert.throws(
      () => tagCommit(specdiveDir, { sha: "xyz", message: "x", ids: [id] }, guard, "mcp"),
      /invalid sha/,
    );
    assert.throws(
      () => tagCommit(specdiveDir, { sha: SHA, message: "x", ids: [] }, guard, "mcp"),
      /ids must not be empty/,
    );
    assert.throws(
      () =>
        tagCommit(
          specdiveDir,
          { sha: SHA, message: "x", ids: ["FEAT-999"] },
          guard,
          "mcp",
        ),
      /FEAT-999/,
    );
    assert.throws(
      () =>
        tagCommit(
          specdiveDir,
          { sha: SHA, message: "x", ids: [id], committed_at: "not-a-date" },
          guard,
          "mcp",
        ),
      /invalid committed_at/,
    );
  });
});

test("commits survive serialize → parse round trip", () => {
  const spec = parseSpec(
    serializeSpec({
      frontmatter: {
        id: "FEAT-002",
        title: "OAuth",
        status: "backlog",
        source_files: [],
        depends_on: [],
        commits: [{ sha: SHA, message: "Add oauth callback" }],
        updated_by: "mcp",
        updated_at: "2026-08-17T00:00:00.000Z",
      },
      body: "## Summary\nx\n",
    }),
  );
  assert.deepEqual(spec.frontmatter.commits, [
    { sha: SHA, message: "Add oauth callback" },
  ]);
});

test("author and committed_at survive serialize → parse round trip", () => {
  const commit = {
    sha: SHA,
    message: "Add oauth callback",
    author: "cursor",
    committed_at: "2026-08-17T12:00:00.000Z",
  };
  const spec = parseSpec(
    serializeSpec({
      frontmatter: {
        id: "FEAT-002",
        title: "OAuth",
        status: "backlog",
        source_files: [],
        depends_on: [],
        commits: [commit],
        updated_by: "mcp",
        updated_at: "2026-08-17T00:00:00.000Z",
      },
      body: "## Summary\nx\n",
    }),
  );
  assert.deepEqual(spec.frontmatter.commits, [commit]);
});

test("parseSpec defaults missing commits to []", () => {
  const text = [
    "---",
    "id: FEAT-001",
    "title: Old",
    "status: done",
    "source_files: []",
    "depends_on: []",
    "updated_by: mcp",
    "updated_at: '2026-08-14T00:00:00.000Z'",
    "---",
    "## Summary",
    "x",
    "",
  ].join("\n");
  assert.deepEqual(parseSpec(text).frontmatter.commits, []);
});
