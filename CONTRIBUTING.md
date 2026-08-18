# Contributing

## Local development setup

```bash
git clone <this-repo> && cd specdive
npm install
npm run build        # outputs dist/
npm link             # makes `specdive` available globally
```

`bin` points at `dev.js`, which spawns `tsx` on `src/index.ts` (runs
TypeScript directly). `publishConfig.bin` overrides to `dist/index.js` for
published versions.

Now from any repo:

```bash
specdive init --target opencode   # scaffold .specdive/ + wire MCP
specdive view                     # PM webpage
specdive mcp                      # run the MCP server (stdio)
```

There's no watch or auto-reload — each `specdive <cmd>` is a fresh process,
so just re-run after editing `src/`. Or run without linking:

```bash
npx tsx src/index.ts <command>    # dev
./dist/index.js <command>         # built
```

## Commands

```bash
npm run typecheck   # tsc --noEmit
npm run build       # tsc -p tsconfig.build.json (for publishing)
npm test            # node --test --import tsx tests/*.test.ts
```

- **Typecheck:** `npm run typecheck`
- **Build:** `npm run build` → `dist/`
- **Test:** `npm test` (frontmatter round-trip, ids, write-guard, state
  rebuild, status enum, MCP handler integration, CLI init)
- **Run (dev):** `npx tsx src/index.ts <command>`
- **Run (built):** `./dist/index.js <command>`
- **Run MCP server (dev):** `npx tsx src/index.ts mcp`
- **Run MCP server (built):** `./dist/index.js mcp`

Run the full build before committing; fix all errors first. Never commit
secrets; `.env` files are gitignored by design.

## Unlink

```bash
npm unlink -g specdive
```

See `AGENTS.md` for the contribution contract (code-quality rules,
the write-side-only trust model, spec-writing rules).
