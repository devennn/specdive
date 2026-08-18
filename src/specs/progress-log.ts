/** Pure helpers for editing the `## Progress Log` section of a spec body. */

/**
 * Appends a `- YYYY-MM-DD: note` line to the `## Progress Log` section.
 * If the section is missing, appends a new one at the end of the body.
 * All other content is preserved verbatim.
 */
export function appendProgressEntry(body: string, note: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const entry = `- ${today}: ${note}`;
  const lines = body.split("\n");

  const headerIdx = lines.findIndex((l) => l.trim() === "## Progress Log");
  if (headerIdx === -1) {
    return `${ensureTrailingNewlines(body)}## Progress Log\n${entry}\n`;
  }

  // End of the Progress Log section = next `## ` header, or end of file.
  let insertIdx = lines.length;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (lines[i]!.startsWith("## ")) {
      insertIdx = i;
      break;
    }
  }
  // Walk back over trailing blank lines so the entry sits at the section's
  // content end rather than after a gap.
  while (insertIdx - 1 > headerIdx && lines[insertIdx - 1]!.trim() === "") {
    insertIdx--;
  }
  lines.splice(insertIdx, 0, entry);
  return lines.join("\n");
}

/** Ensures the body ends with exactly one blank line before a new section. */
function ensureTrailingNewlines(body: string): string {
  if (body.length === 0) return "";
  if (body.endsWith("\n\n")) return body;
  if (body.endsWith("\n")) return body + "\n";
  return body + "\n\n";
}
