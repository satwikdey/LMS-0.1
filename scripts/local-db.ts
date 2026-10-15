/** Runs a persistent local PostgreSQL for development: `npm run db:local` (add `-- --seed` to load demo data). */
import path from "node:path";
import { migrateDeploy, startPg } from "./embedded-pg";
import { spawnSync } from "node:child_process";

async function main() {
  const port = Number(process.env.LOCAL_DB_PORT ?? 54329);
  const pg = await startPg({ dir: path.join(process.cwd(), ".pgdata"), port, database: "school" });
  migrateDeploy(pg.url);
  if (process.argv.includes("--seed")) {
    const tsx = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
    const r = spawnSync(process.execPath, [tsx, "prisma/seed.ts"], {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: pg.url, DIRECT_URL: pg.url },
    });
    if (r.status !== 0) process.exit(r.status ?? 1);
  }
  console.log(`\nLocal PostgreSQL ready:\n  DATABASE_URL=${pg.url}\n  DIRECT_URL=${pg.url}\nPress Ctrl+C to stop.`);
  const stop = async () => {
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  setInterval(() => undefined, 1 << 30);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
