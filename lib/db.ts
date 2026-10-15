import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.PRISMA_LOG === "1" ? ["query", "warn", "error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** A Prisma client or an interactive-transaction client. */
export type Db = PrismaClient | Prisma.TransactionClient;
export type Tx = Prisma.TransactionClient;

const RETRYABLE = new Set(["P2034", "40001", "40P01"]);

function isRetryable(e: unknown): boolean {
  const err = e as { code?: string; meta?: { code?: string } };
  return RETRYABLE.has(err?.code ?? "") || RETRYABLE.has(err?.meta?.code ?? "");
}

/**
 * Run `fn` in a serialisable-safe interactive transaction, retrying on deadlock /
 * serialisation failures. `fn` must be idempotent with respect to external effects
 * (do external calls outside the transaction).
 */
export async function transact<T>(
  fn: (tx: Tx) => Promise<T>,
  opts: { attempts?: number; timeout?: number } = {},
): Promise<T> {
  const attempts = opts.attempts ?? 3;
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await prisma.$transaction(fn, { maxWait: 10_000, timeout: opts.timeout ?? 30_000 });
    } catch (e) {
      last = e;
      if (!isRetryable(e) || i === attempts - 1) throw e;
      await new Promise((r) => setTimeout(r, 40 * (i + 1) + Math.random() * 40));
    }
  }
  throw last;
}

/** Take a row lock (`SELECT … FOR UPDATE`) on a record by id. Table must be a trusted literal. */
export async function lockRow(
  tx: Tx,
  table:
    | "Section"
    | "Application"
    | "Exam"
    | "FeeAccount"
    | "Payment"
    | "PayrollRecord"
    | "Enrollment"
    | "PromotionDecision"
    | "SchoolClass",
  id: string,
): Promise<void> {
  await tx.$queryRawUnsafe(`SELECT id FROM "${table}" WHERE id = $1 FOR UPDATE`, id);
}

/** Atomically allocate the next value of a named counter. */
export async function nextSequence(tx: Tx, key: string): Promise<number> {
  const rows = await tx.$queryRaw<{ value: number }[]>`
    INSERT INTO "Sequence" ("key", "value") VALUES (${key}, 1)
    ON CONFLICT ("key") DO UPDATE SET "value" = "Sequence"."value" + 1
    RETURNING "value"`;
  return Number(rows[0].value);
}

export { Prisma };
