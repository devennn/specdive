import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  handleHealth,
  handleInit,
  handleUpdate,
  handleCreateSpec,
  handleUpdateStatus,
  handleLogProgress,
  handleTagCommit,
  handleListSpecs,
} from "./handlers.js";
import { VERSION } from "../version.js";

const STATUS_DESC = "done | backlog";

/** Builds and registers all specdive write-side tools on one McpServer. */
export function createServer(): McpServer {
  const server = new McpServer(
    { name: "specdive", version: VERSION },
    { capabilities: { tools: {} } },
  );

  server.registerTool("specdive_health", {
    description:
      "Ping specdive. Returns ok, name, version, whether .specdive/ is initialized, and specdiveDir. Call this to confirm the MCP server is reachable.",
    inputSchema: {},
  }, () => wrap(() => handleHealth()));

  server.registerTool("specdive_init", {
    description: "Create .specdive/ and return the AI-assistant INSTRUCTIONS. Fails if .specdive/ already exists — use specdive_update to refresh instructions.",
    inputSchema: {},
  }, () => wrap(() => handleInit()));

  server.registerTool("specdive_update", {
    description: "Refresh .specdive/INSTRUCTIONS.md to the current contract and inject missing AGENTS.md instruction blocks. Does not touch config.yml or specs. Fails if .specdive/ does not exist.",
    inputSchema: {},
  }, () => wrap(() => handleUpdate()));

  server.registerTool("specdive_create_spec", {
    description: "Create one spec markdown file (one feature). Returns the assigned FEAT-NNN id.",
    inputSchema: {
      title: z.string().describe("Feature name, PM-readable"),
      status: z.string().describe(STATUS_DESC),
      content: z.string().describe("Prose body: Summary, Capabilities, Known Issues, Security Notes, Open Questions"),
      source_files: z.array(z.string()).optional().describe("Real files implementing the feature"),
      depends_on: z.array(z.string()).optional().describe("FEAT-NNN ids this feature depends on"),
    },
  }, (args) =>
    wrap(() =>
      handleCreateSpec({
        title: args.title,
        status: args.status,
        content: args.content,
        source_files: args.source_files,
        depends_on: args.depends_on,
      }),
    ),
  );

  server.registerTool("specdive_update_status", {
    description: "Update a spec's frontmatter status.",
    inputSchema: {
      id: z.string().describe("FEAT-NNN spec id"),
      status: z.string().describe(STATUS_DESC),
    },
  }, (args) => wrap(() => handleUpdateStatus(args.id, args.status)));

  server.registerTool("specdive_log_progress", {
    description: "Append a timestamped entry to a spec's ## Progress Log.",
    inputSchema: {
      id: z.string().describe("FEAT-NNN spec id"),
      note: z.string().describe("What changed; written as `- YYYY-MM-DD: note`"),
    },
  }, (args) => wrap(() => handleLogProgress(args.id, args.note)));

  server.registerTool("specdive_tag_commit", {
    description:
      "Tag one git commit onto one or more specs. Call after you create a commit. One commit may touch multiple features — pass every FEAT-NNN id it affects. specdive does not run git; you supply the SHA, subject, author, and commit time.",
    inputSchema: {
      sha: z.string().describe("Git commit SHA (full or abbreviated hex)"),
      message: z.string().describe("Commit subject line"),
      ids: z.array(z.string()).describe("FEAT-NNN spec ids this commit touches (one or more)"),
      author: z.string().optional().describe("Commit author name (git %an). If omitted, stamped as the MCP host."),
      committed_at: z.string().optional().describe("Commit time as ISO-8601 (git %aI). If omitted, stamped now."),
    },
  }, (args) =>
    wrap(() => handleTagCommit({
      sha: args.sha,
      message: args.message,
      ids: args.ids,
      author: args.author,
      committed_at: args.committed_at,
    })),
  );

  server.registerTool("specdive_list_specs", {
    description: "List spec summaries, optionally filtered by status.",
    inputSchema: { status: z.string().optional().describe(`Filter: ${STATUS_DESC}`) },
  }, (args) => wrap(() => handleListSpecs(args.status)));

  return server;
}

/** Runs the MCP server over stdio. Returns when the transport closes. */
export async function runMcpServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

/**
 * Wraps a handler call so any thrown error still becomes a structured
 * ToolResult (never throws into the MCP framework). Errors are logged to
 * stderr with the specdive prefix.
 */
function wrap(fn: () => CallToolResult): CallToolResult {
  try {
    return fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[specdive] Unexpected error", msg);
    return { content: [{ type: "text", text: `Unexpected error: ${msg}` }], isError: true };
  }
}
