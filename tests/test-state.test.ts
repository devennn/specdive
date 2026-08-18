import { test } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initSpecdive } from "../src/scaffold.js";
import { rebuildState, loadState } from "../src/specs/state.js";
import { createSpec } from "../src/specs/write.js";
import { readAllSummaries, listSummaries } from "../src/specs/read.js";
import { createWriteGuard } from "../src/io/write-guard.js";

function makeRepo(): string {
  return mkdtempSync(join(tmpdir(), "specdive-state-"));
}

test("rebuildState writes state.json with sorted specs and canonical JSON", () => {
  const repo = makeRepo();
  try {
    initSpecdive(repo);
    const specdiveDir = join(repo, ".specdive");
    const guard = createWriteGuard(specdiveDir);

    createSpec(specdiveDir, { title: "Beta", status: "done", content: "## Summary\nb\n" }, guard, "mcp");
    createSpec(specdiveDir, { title: "Alpha", status: "backlog", content: "## Summary\na\n" }, guard, "mcp");
    rebuildState(specdiveDir, guard);

    const stateText = readFileSync(join(specdiveDir, "state.json"), "utf8");
    // Canonical JSON: 2-space indent, trailing newline, sorted keys.
    assert.ok(stateText.endsWith("\n"));
    assert.ok(stateText.includes('"specs"'));
    const state = loadState(specdiveDir);
    assert.equal(state.specs.length, 2);
    assert.deepEqual(
      state.specs.map((s) => s.id),
      ["FEAT-001", "FEAT-002"],
      "specs sorted by id",
    );
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test("listSummaries filters by status", () => {
  const repo = makeRepo();
  try {
    initSpecdive(repo);
    const specdiveDir = join(repo, ".specdive");
    const guard = createWriteGuard(specdiveDir);
    createSpec(specdiveDir, { title: "A", status: "backlog", content: "## Summary\na\n" }, guard, "mcp");
    createSpec(specdiveDir, { title: "B", status: "done", content: "## Summary\nb\n" }, guard, "mcp");
    createSpec(specdiveDir, { title: "C", status: "done", content: "## Summary\nc\n" }, guard, "mcp");

    assert.equal(readAllSummaries(specdiveDir).length, 3);
    assert.equal(listSummaries(specdiveDir, "done").length, 2);
    assert.equal(listSummaries(specdiveDir, "backlog").length, 1);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
