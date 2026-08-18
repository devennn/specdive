import { test } from "node:test";
import { strict as assert } from "node:assert";
import {
  formatSpecId,
  nextSpecId,
  isSpecId,
  isStatus,
  normalizeStatus,
  SPEC_ID_PATTERN,
} from "../src/specs/ids.js";

test("formatSpecId zero-pads to 3 digits", () => {
  assert.equal(formatSpecId(1), "FEAT-001");
  assert.equal(formatSpecId(42), "FEAT-042");
  assert.equal(formatSpecId(999), "FEAT-999");
  assert.equal(formatSpecId(1000), "FEAT-1000");
});

test("nextSpecId returns FEAT-001 on an empty repo and increments the max", () => {
  assert.equal(nextSpecId([]), "FEAT-001");
  assert.equal(nextSpecId(["FEAT-001"]), "FEAT-002");
  assert.equal(nextSpecId(["FEAT-003", "FEAT-001"]), "FEAT-004");
  assert.equal(nextSpecId(["FEAT-099"]), "FEAT-100");
  assert.equal(nextSpecId(["FEAT-1000", "FEAT-002"]), "FEAT-1001");
});

test("nextSpecId ignores non-spec-id strings", () => {
  assert.equal(nextSpecId(["notes", "FEAT-005", "FEAT-2"]), "FEAT-006");
});

test("isSpecId validates the FEAT-NNN format", () => {
  assert.ok(isSpecId("FEAT-001"));
  assert.ok(isSpecId("FEAT-1000"));
  assert.ok(!isSpecId("feat-001"));
  assert.ok(!isSpecId("FEAT-1"));
  assert.ok(!isSpecId("FEAT-001-extra"));
  assert.ok(!isSpecId("FEATURE-001"));
  assert.equal(SPEC_ID_PATTERN.test("FEAT-001"), true);
});

test("isStatus narrows to the allowed enum values", () => {
  assert.ok(isStatus("done"));
  assert.ok(isStatus("backlog"));
  assert.ok(!isStatus("todo"));
  assert.ok(!isStatus("in_progress"));
  assert.ok(!isStatus("blocked"));
  assert.ok(!isStatus("complete"));
  assert.ok(!isStatus(""));
});

test("normalizeStatus maps legacy values to backlog", () => {
  assert.equal(normalizeStatus("done"), "done");
  assert.equal(normalizeStatus("backlog"), "backlog");
  assert.equal(normalizeStatus("todo"), "backlog");
  assert.equal(normalizeStatus("in_progress"), "backlog");
  assert.equal(normalizeStatus("blocked"), "backlog");
  assert.equal(normalizeStatus("complete"), null);
});
