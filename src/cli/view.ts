import { startViewServer } from "../view/server.js";
import { EXIT_PORT_IN_USE } from "./exit-codes.js";
import { SPECDIVE_DIR } from "../io/paths.js";
import { join } from "node:path";

/** `specdive view [--port] [--host]`: start the local PM webpage. */
export async function viewCommand(opts: {
  port: number;
  host: string;
}): Promise<number> {
  try {
    await startViewServer({
      port: opts.port,
      host: opts.host,
      specdiveDir: join(process.cwd(), SPECDIVE_DIR),
    });
    // Stay alive until killed. Resolving would exit the process.
    return await new Promise<number>(() => {});
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes("eaddrinuse") || msg.toLowerCase().includes("port")) {
      console.error(`[specdive] port ${opts.port} already in use`);
      return EXIT_PORT_IN_USE;
    }
    console.error("[specdive] Unexpected error", msg);
    return 1;
  }
}
