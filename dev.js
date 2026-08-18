#!/usr/bin/env node
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tsxPath = resolve(__dirname, "node_modules", ".bin", "tsx");
const scriptPath = resolve(__dirname, "src", "index.ts");

const child = spawn(tsxPath, [scriptPath, ...process.argv.slice(2)], {
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 0));
