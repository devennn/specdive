import { test } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initSpecdive } from "../src/scaffold.js";
import { createSpec } from "../src/specs/write.js";
import { tagCommit } from "../src/specs/tag-commit.js";
import { loadActivity } from "../src/specs/activity.js";
import { readSpec } from "../src/specs/read.js";
import { serializeSpec } from "../src/specs/serialize.js";
import { specFilePath } from "../src/io/paths.js";
import { atomicWriteText } from "../src/io/atomic-write.js";
import { createWriteGuard } from "../src/io/write-guard.js";

function withRepo<T>(fn: (specdiveDir: string) => T): T {
  const repo = mkdtempSync(join(tmpdir(), "specdive-act-"));
  try {
    initSpecdive(repo);
    return fn(join(repo, ".specdive"));
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
}

const SHA = "a1b2c3d4e5f6789012345678901234567890abcd";

test("loadActivity folds the same SHA on two specs into one event", () => {
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
    tagCommit(
      specdiveDir,
      {
        sha: SHA,
        message: "wire oauth into dashboard",
        ids: [a, b],
        author: "cursor",
        committed_at: "2026-08-18T12:00:00.000Z",
      },
      guard,
      "mcp",
    );

    const { events } = loadActivity(specdiveDir);
    assert.equal(events.length, 1);
    const event = events[0]!;
    assert.equal(event.sha, SHA);
    assert.equal(event.message, "wire oauth into dashboard");
    assert.equal(event.author, "cursor");
    assert.equal(event.committed_at, "2026-08-18T12:00:00.000Z");
    assert.deepEqual(event.specs, [
      { id: a, title: "Auth" },
      { id: b, title: "Dashboard" },
    ]);
  });
});

test("loadActivity sorts newer committed_at first and untimed last", () => {
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
        sha: "aaaaaaa",
        message: "older",
        ids: [id],
        committed_at: "2026-08-17T12:00:00.000Z",
      },
      guard,
      "mcp",
    );
    tagCommit(
      specdiveDir,
      {
        sha: SHA,
        message: "newer",
        ids: [id],
        committed_at: "2026-08-18T12:00:00.000Z",
      },
      guard,
      "mcp",
    );

    const { events } = loadActivity(specdiveDir);
    assert.equal(events[0]!.sha, SHA);
    assert.equal(events[1]!.sha, "aaaaaaa");
  });
});

test("loadActivity puts legacy commits without committed_at last", () => {
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
        message: "timed",
        ids: [id],
        committed_at: "2026-08-18T12:00:00.000Z",
      },
      guard,
      "mcp",
    );
    const spec = readSpec(specdiveDir, id);
    spec.frontmatter.commits = [
      ...spec.frontmatter.commits,
      { sha: "ccccccc", message: "legacy" },
    ];
    atomicWriteText(specdiveDir, specFilePath(id), serializeSpec(spec), guard);

    const { events } = loadActivity(specdiveDir);
    assert.equal(events[0]!.sha, SHA);
    assert.equal(events[1]!.sha, "ccccccc");
    assert.equal(events[1]!.committed_at, undefined);
  });
});

test("loadActivity is empty when no commits are tagged", () => {
  withRepo((specdiveDir) => {
    const guard = createWriteGuard(specdiveDir);
    createSpec(
      specdiveDir,
      { title: "Auth", status: "backlog", content: "## Summary\na\n" },
      guard,
      "mcp",
    );
    assert.deepEqual(loadActivity(specdiveDir).events, []);
  });
});
