import { test } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createWriteGuard,
  WriteBoundaryError,
} from "../src/io/write-guard.js";
import { atomicWriteText } from "../src/io/atomic-write.js";

function makeSpecdive(): { dir: string; specdiveDir: string } {
  const dir = mkdtempSync(join(tmpdir(), "specdive-wg-"));
  const specdiveDir = join(dir, ".specdive");
  mkdirSync(join(specdiveDir, "specs"), { recursive: true });
  return { dir, specdiveDir };
}

test("write guard allows writes inside .specdive/", () => {
  const { specdiveDir, dir } = makeSpecdive();
  try {
    const guard = createWriteGuard(specdiveDir);
    assert.doesNotThrow(() => guard.assertWritable("specs/FEAT-001.md"));
    assert.doesNotThrow(() => guard.assertWritable(join(specdiveDir, "specs", "FEAT-001.md")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("write guard refuses paths that escape .specdive/ via ..", () => {
  const { specdiveDir, dir } = makeSpecdive();
  try {
    const guard = createWriteGuard(specdiveDir);
    assert.throws(
      () => guard.assertWritable("../escape.txt"),
      WriteBoundaryError,
    );
    assert.throws(
      () => guard.assertWritable("specs/../../escape.txt"),
      WriteBoundaryError,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("write guard refuses absolute paths outside .specdive/", () => {
  const { dir, specdiveDir } = makeSpecdive();
  try {
    const guard = createWriteGuard(specdiveDir);
    assert.throws(
      () => guard.assertWritable(join(dir, "outside.txt")),
      WriteBoundaryError,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("write guard refuses to overwrite protected secret files", () => {
  const { specdiveDir, dir } = makeSpecdive();
  try {
    const guard = createWriteGuard(specdiveDir);
    assert.throws(() => guard.assertWritable(".env"), WriteBoundaryError);
    assert.throws(() => guard.assertWritable(".env.example"), WriteBoundaryError);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("atomicWriteText throws when the target escapes the boundary (no file written)", () => {
  const { specdiveDir, dir } = makeSpecdive();
  try {
    const guard = createWriteGuard(specdiveDir);
    assert.throws(
      () => atomicWriteText(specdiveDir, "../escape.txt", "x", guard),
      WriteBoundaryError,
    );
    assert.ok(
      !existsSync(join(dir, "escape.txt")),
      "must not have written outside .specdive/",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
