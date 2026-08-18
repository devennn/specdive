import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { paths } from "../io/paths.js";

/**
 * Human-readable project name from `.specdive/config.yml`, or the working
 * directory name when `project` is unset or empty.
 */
export function projectName(specdiveDir: string, cwd: string): string {
  const fromConfig = readConfigProject(specdiveDir);
  return fromConfig || basename(cwd);
}

function readConfigProject(specdiveDir: string): string {
  const file = join(specdiveDir, paths.config);
  if (!existsSync(file)) return "";
  const m = readFileSync(file, "utf8").match(/^project:\s*(.*)$/m);
  if (!m) return "";
  return yamlUnquote(stripInlineComment(m[1] ?? ""));
}

function stripInlineComment(raw: string): string {
  const i = raw.indexOf(" #");
  return (i === -1 ? raw : raw.slice(0, i)).trim();
}

function yamlUnquote(s: string): string {
  if (
    s.length >= 2 &&
    ((s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'")))
  ) {
    return s.slice(1, -1);
  }
  return s;
}
