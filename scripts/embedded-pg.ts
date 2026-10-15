/**
 * Starts a real PostgreSQL server from the `embedded-postgres` package (no Docker / system install).
 * Used by integration tests, the e2e suite and `npm run db:local`.
 */
import EmbeddedPostgres from "embedded-postgres";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { spawnSync } from "node:child_process";
import path from "node:path";

export interface RunningPg {
  url: string;
  port: number;
  stop(): Promise<void>;
}

export function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address() as { port: number };
      srv.close(() => resolve(port));
    });
  });
}

export async function startPg(opts: {
  dir: string;
  port: number;
  database: string;
  removeOnStop?: boolean;
}): Promise<RunningPg> {
  const { dir, port, database } = opts;
  const fresh = !existsSync(path.join(dir, "PG_VERSION"));
  if (fresh) mkdirSync(dir, { recursive: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dir,
    user: "postgres",
    password: "postgres",
    port,
    persistent: true,
    initdbFlags: ["--encoding=UTF8", "--locale=C", "--lc-collate=C"],
    onLog: () => undefined,
    onError: () => undefined,
  });
  if (fresh) await pg.initialise();
  await pg.start();
  try {
    await pg.createDatabase(database);
  } catch {
    /* database already exists */
  }
  return {
    url: `postgresql://postgres:postgres@localhost:${port}/${database}`,
    port,
    async stop() {
      await pg.stop();
      if (opts.removeOnStop) {
        // Windows may hold file handles briefly after shutdown.
        for (let i = 0; i < 5; i++) {
          try {
            rmSync(dir, { recursive: true, force: true });
            break;
          } catch {
            await new Promise((r) => setTimeout(r, 300));
          }
        }
      }
    },
  };
}

/** `prisma migrate deploy` against `url` — exactly what production runs. */
export function migrateDeploy(url: string): void {
  const prismaBin = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
  const res = spawnSync(process.execPath, [prismaBin, "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
    encoding: "utf8",
  });
  if (res.status !== 0) {
    throw new Error(`prisma migrate deploy failed:\n${res.stdout}\n${res.stderr}`);
  }
}
