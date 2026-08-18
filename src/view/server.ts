import { type Server } from "node:http";
import express, { type Request, type Response } from "express";
import chokidar from "chokidar";
import { join } from "node:path";
import { renderPage } from "./html.js";
import { ICON_SVG } from "./icon.js";
import { loadState } from "../specs/state.js";
import { readSpec, isInitialized } from "../specs/read.js";
import { projectName } from "../specs/config.js";
import { checkStatus } from "../cli/status.js";
import { paths, SPECDIVE_DIR } from "../io/paths.js";

export interface ViewOptions {
  port: number;
  host: string;
  specdiveDir?: string;
}

/** Starts the local view server. Resolves to the http.Server once listening. */
export function startViewServer(opts: ViewOptions): Promise<Server> {
  const specdiveDir = opts.specdiveDir ?? join(process.cwd(), SPECDIVE_DIR);
  if (!isInitialized(specdiveDir)) {
    return Promise.reject(
      new Error(
        `.specdive/ not found at ${specdiveDir}. Run \`specdive init\` first.`,
      ),
    );
  }

  const app = express();
  const clients = new Set<Response>();

  app.get("/", (_req, res) => {
    res.type("html").send(renderPage(projectName(specdiveDir, process.cwd())));
  });

  app.get("/favicon.svg", sendIcon);
  app.get("/favicon.ico", sendIcon);

  app.get("/api/specs", (_req, res) => {
    res.json(loadState(specdiveDir));
  });

  app.get("/api/status", async (_req: Request, res: Response) => {
    try {
      res.json(await checkStatus());
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.get("/api/specs/:id", (req: Request, res: Response) => {
    const id = String(req.params.id);
    try {
      const spec = readSpec(specdiveDir, id);
      res.json({ frontmatter: spec.frontmatter, body: spec.body });
    } catch {
      res.status(404).json({ error: `spec not found: ${id}` });
    }
  });

  app.get("/api/events", (_req: Request, res: Response) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(": connected\n\n");
    clients.add(res);
    _req.on("close", () => clients.delete(res));
  });

  // Live updates: watch spec files and push a 'change' event to all SSE
  // clients. Clients then re-fetch /api/specs. state.json is rebuilt by the
  // write tools; the view stays read-only.
  const watcher = chokidar.watch(join(specdiveDir, paths.specsDir, "*.md"), {
    ignoreInitial: true,
  });
  watcher.on("all", () => {
    for (const res of clients) res.write("event: change\ndata: {}\n\n");
  });

  return new Promise((resolve, reject) => {
    const server = app.listen(opts.port, opts.host, () => {
      console.log(`[specdive] view at http://${opts.host}:${opts.port}`);
      resolve(server);
    });
    server.on("error", (err) => {
      watcher.close();
      reject(err);
    });
    server.on("close", () => watcher.close());
  });
}

function sendIcon(_req: Request, res: Response): void {
  res.type("image/svg+xml").send(ICON_SVG);
}
