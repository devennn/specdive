# specdive

An AI coding assistant can keep feature specs next to the code instead of
in a tracker that goes stale. specdive gives it MCP tools to write those
specs into `.specdive/`, and a local page to read them.

Build from source: [CONTRIBUTING.md](CONTRIBUTING.md).

## Commands

### `specdive init`

Create `.specdive/` in the current repo and optionally wire the MCP server
into a host assistant. Refuses if `.specdive/` already exists — use
`update` instead.

| Arg | Required | Default | Description |
| --- | --- | --- | --- |
| `-t, --target <cursor\|opencode>` | no | prompt (or skip if not a TTY) | Host to write a local stdio MCP entry into: Cursor (`.cursor/mcp.json`) or OpenCode (`opencode.json`) |

### `specdive update`

Refresh `.specdive/INSTRUCTIONS.md` and insert missing `AGENTS.md` blocks
(status rule, commit tagging). Does not touch `config.yml`, specs, or the
host MCP config. Fails if `.specdive/` is missing.

No args.

### `specdive install`

Wire the specdive MCP server into a host config only (no scaffolding).
Merges into an existing file; other servers and user keys on the specdive
entry are kept. Only the launch command is forced back to current.

| Arg | Required | Default | Description |
| --- | --- | --- | --- |
| `-t, --target <cursor\|opencode>` | yes | — | Host config to write: `cursor` → `.cursor/mcp.json`; `opencode` → `opencode.json` |

Override the launch command with `SPECDIVE_CMD` (default `npx specdive mcp`).

### `specdive view`

Serve the specs in `.specdive/` over HTTP. Prints the URL; does not open a
browser. Stays running until killed.

| Arg | Required | Default | Description |
| --- | --- | --- | --- |
| `-p, --port <port>` | no | `4747` | Port to bind |
| `-H, --host <host>` | no | `127.0.0.1` | Address to bind |

### `specdive mcp`

Run the specdive MCP server on stdio. Used by the host assistant; you
rarely run this yourself.

No args.

## MCP tools

Write-side only. The assistant reads the repo with its own file tools.

| Tool | Args | What it does |
| --- | --- | --- |
| `specdive_health` | — | Ping: ok, version, whether `.specdive/` exists |
| `specdive_init` | — | Create `.specdive/` (fails if it exists) |
| `specdive_update` | — | Refresh `INSTRUCTIONS.md` + missing `AGENTS.md` blocks |
| `specdive_create_spec` | `title`, `status` (`done` \| `backlog`), `content`; optional `source_files`, `depends_on` | Write one spec file, return `FEAT-NNN` |
| `specdive_update_status` | `id`, `status` | Update frontmatter status |
| `specdive_log_progress` | `id`, `note` | Append a timestamped Progress Log entry |
| `specdive_tag_commit` | `sha`, `message`, `ids` | Record a git commit on one or more specs (does not run git) |
| `specdive_list_specs` | optional `status` | List specs |

## License

MIT
