import type { Position } from "@prisma/client";
import { prisma } from "@/lib/db";
import { forbiddenRole, forbiddenScope, notFound } from "@/lib/errors";
import type { Ctx } from "@/lib/authz/context";

export function requireAny(ctx: Ctx, ...positions: Position[]): void {
  if (ctx.account.kind !== "STAFF" || !ctx.has(...positions)) throw forbiddenRole();
}

export function requireStudent(ctx: Ctx): NonNullable<Ctx["student"]> {
  if (ctx.account.kind !== "STUDENT" || !ctx.student) throw forbiddenRole();
  return ctx.student;
}

export async function classIdOfSection(sectionId: string): Promise<string> {
  const s = await prisma.section.findUnique({ where: { id: sectionId }, select: { classId: true } });
  if (!s) throw notFound("Section");
  return s.classId;
}

export async function sectionOfOffering(offeringId: string) {
  const o = await prisma.sectionSubject.findUnique({
    where: { id: offeringId },
    select: { id: true, sectionId: true, classSubjectId: true, section: { select: { classId: true } } },
  });
  if (!o) throw notFound("Subject offering");
  return { id: o.id, sectionId: o.sectionId, classSubjectId: o.classSubjectId, classId: o.section.classId };
}

export function assertIncharge(ctx: Ctx, classId: string): void {
  if (!ctx.inchargeClassIds.has(classId)) throw forbiddenScope("You are not the Teacher Incharge of this class");
}

export async function assertInchargeOfSection(ctx: Ctx, sectionId: string): Promise<string> {
  const classId = await classIdOfSection(sectionId);
  assertIncharge(ctx, classId);
  return classId;
}

export function assertSectionHead(ctx: Ctx, sectionId: string): void {
  if (!ctx.headSectionIds.has(sectionId)) throw forbiddenScope("You are not the Section Teacher Head of this section");
}

export function assertTeaches(ctx: Ctx, offeringId: string): void {
  if (!ctx.offeringIds.has(offeringId)) throw forbiddenScope("You are not the responsible teacher for this subject offering");
}

/**
 * Class ids a staff member may *read* academic data for:
 * Stakeholder/Principal → all (null); others → union of their incharge/head/teaching classes.
 */
export async function readableClassIds(ctx: Ctx): Promise<string[] | null> {
  if (ctx.has("STAKEHOLDER", "PRINCIPAL")) return null;
  const ids = new Set<string>(ctx.inchargeClassIds);
  if (ctx.headSectionIds.size || ctx.offeringIds.size) {
    const sections = await prisma.section.findMany({
      where: {
        OR: [
          { id: { in: [...ctx.headSectionIds] } },
          { offerings: { some: { id: { in: [...ctx.offeringIds] } } } },
        ],
      },
      select: { classId: true },
    });
    sections.forEach((s) => ids.add(s.classId));
  }
  return [...ids];
}

/** Can the caller view students of this section (head, incharge of class, principal/stakeholder, or a teacher of it)? */
export async function canViewSection(ctx: Ctx, sectionId: string): Promise<boolean> {
  if (ctx.has("STAKEHOLDER", "PRINCIPAL") || ctx.headSectionIds.has(sectionId)) return true;
  const classId = await classIdOfSection(sectionId);
  if (ctx.inchargeClassIds.has(classId)) return true;
  if (ctx.offeringIds.size === 0) return false;
  const n = await prisma.sectionSubject.count({ where: { sectionId, id: { in: [...ctx.offeringIds] } } });
  return n > 0;
}
