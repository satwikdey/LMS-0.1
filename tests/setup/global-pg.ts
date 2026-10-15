import os from "node:os";
import path from "node:path";
import { mkdtempSync } from "node:fs";
import type { GlobalSetupContext } from "vitest/node";
import { freePort, migrateDeploy, startPg, type RunningPg } from "../../scripts/embedded-pg";

let pg: RunningPg | undefined;

/** Boots a throw-away PostgreSQL and applies the production migrations to it. */
export async function setup({ provide }: GlobalSetupContext) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "school-pg-"));
  pg = await startPg({ dir, port: await freePort(), database: "school_test", removeOnStop: true });
  migrateDeploy(pg.url);
  provide("databaseUrl", pg.url);
}

export async function teardown() {
  await pg?.stop();
}

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}
