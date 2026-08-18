import { STATUS_VALUES, type Status } from "./types.js";

/** Matches a valid spec id: `FEAT-` followed by 3+ zero-padded digits (FEAT-001 … FEAT-999, FEAT-1000). */
export const SPEC_ID_PATTERN = /^FEAT-\d{3,}$/;

const LEGACY_BACKLOG: readonly string[] = ["todo", "in_progress", "blocked"];

/** True if `value` is one of the canonical status values (`done` | `backlog`). */
export function isStatus(value: string): value is Status {
  return (STATUS_VALUES as readonly string[]).includes(value);
}

/**
 * Maps a status string to a canonical value. Legacy
 * `todo` / `in_progress` / `blocked` become `backlog`. Returns null if unknown.
 */
export function normalizeStatus(value: string): Status | null {
  if (isStatus(value)) return value;
  if (LEGACY_BACKLOG.includes(value)) return "backlog";
  return null;
}

/** True if `value` matches the `FEAT-NNN` id format. */
export function isSpecId(value: string): boolean {
  return SPEC_ID_PATTERN.test(value);
}

/**
 * Zero-pads a number into a `FEAT-NNN` id. Width is fixed at 3 digits so
 * ids sort lexicographically in creation order up to FEAT-999; beyond that
 * they simply keep growing (FEAT-1000), preserving order.
 */
export function formatSpecId(n: number): string {
  const padded = String(n).padStart(3, "0");
  return `FEAT-${padded}`;
}

/**
 * Picks the next id for a new spec by reading existing ids for the highest
 * `FEAT-NNN` number and incrementing. Existing id widths are respected:
 * if the highest is `FEAT-099`, the next is `FEAT-100`.
 */
export function nextSpecId(existingIds: readonly string[]): string {
  let max = 0;
  for (const id of existingIds) {
    const match = id.match(SPEC_ID_PATTERN);
    if (match) {
      const n = parseInt(id.slice("FEAT-".length), 10);
      if (n > max) max = n;
    }
  }
  return formatSpecId(max + 1);
}
