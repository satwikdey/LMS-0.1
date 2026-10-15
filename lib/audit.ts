import type { Db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  data?: Prisma.InputJsonValue;
}

/**
 * Append an audit record. Pass the transaction client so the audit row commits or
 * rolls back together with the change it describes.
 */
export async function audit(db: Db, e: AuditEntry): Promise<void> {
  await db.auditLog.create({
    data: {
      actorId: e.actorId ?? null,
      action: e.action,
      entityType: e.entityType,
      entityId: e.entityId ?? null,
      summary: e.summary,
      data: e.data,
    },
  });
}
