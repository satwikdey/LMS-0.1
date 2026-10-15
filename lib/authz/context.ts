import type { Position } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface ActiveAssignment {
  id: string;
  position: Position;
  classId: string | null;
  sectionId: string | null;
  offeringId: string | null;
  academicYearId: string | null;
}

export interface Ctx {
  account: {
    id: string;
    authUserId: string | null;
    displayName: string;
    kind: "STAFF" | "STUDENT";
    authEmail: string;
    registeredEmail: string | null;
    mustChangePassword: boolean;
  };
  assignments: ActiveAssignment[];
  student: { id: string; admissionNumber: string; name: string } | null;
  positions: Set<Position>;
  /** Classes where the caller is the active Teacher Incharge. */
  inchargeClassIds: Set<string>;
  /** Sections where the caller is the active Section Teacher Head. */
  headSectionIds: Set<string>;
  /** Section–subject offerings the caller is the active responsible teacher for. */
  offeringIds: Set<string>;
  has(...p: Position[]): boolean;
}

export function buildContext(
  account: Ctx["account"],
  assignments: ActiveAssignment[],
  student: Ctx["student"],
): Ctx {
  const positions = new Set(assignments.map((a) => a.position));
  const inchargeClassIds = new Set(
    assignments.filter((a) => a.position === "TEACHER_INCHARGE" && a.classId).map((a) => a.classId!),
  );
  const headSectionIds = new Set(
    assignments.filter((a) => a.position === "SECTION_HEAD" && a.sectionId).map((a) => a.sectionId!),
  );
  const offeringIds = new Set(
    assignments.filter((a) => a.position === "SUBJECT_TEACHER" && a.offeringId).map((a) => a.offeringId!),
  );
  return {
    account,
    assignments,
    student,
    positions,
    inchargeClassIds,
    headSectionIds,
    offeringIds,
    has: (...p) => p.some((x) => positions.has(x)),
  };
}

const accountSelect = {
  id: true,
  authUserId: true,
  displayName: true,
  kind: true,
  status: true,
  authEmail: true,
  registeredEmail: true,
  mustChangePassword: true,
  provisioning: true,
  student: { select: { id: true, admissionNumber: true, firstName: true, lastName: true, status: true } },
} as const;

/**
 * Load the caller's authorisation context fresh from the database on every request.
 * Reassignments, position removals and deactivations therefore take effect immediately.
 * Returns null for unknown, inactive or not-yet-provisioned accounts.
 */
async function load(where: { authUserId: string } | { id: string }): Promise<Ctx | null> {
  const acc = await prisma.account.findUnique({ where, select: accountSelect });
  if (!acc || acc.status !== "ACTIVE" || acc.provisioning !== "PROVISIONED") return null;
  if (acc.kind === "STUDENT" && (!acc.student || acc.student.status !== "ACTIVE")) return null;

  const assignments =
    acc.kind === "STAFF"
      ? await prisma.positionAssignment.findMany({
          where: { accountId: acc.id, endedAt: null },
          select: { id: true, position: true, classId: true, sectionId: true, offeringId: true, academicYearId: true },
        })
      : [];

  return buildContext(
    {
      id: acc.id,
      authUserId: acc.authUserId,
      displayName: acc.displayName,
      kind: acc.kind,
      authEmail: acc.authEmail,
      registeredEmail: acc.registeredEmail,
      mustChangePassword: acc.mustChangePassword,
    },
    assignments,
    acc.student
      ? {
          id: acc.student.id,
          admissionNumber: acc.student.admissionNumber,
          name: `${acc.student.firstName} ${acc.student.lastName}`.trim(),
        }
      : null,
  );
}

export const loadContext = (authUserId: string) => load({ authUserId });
export const loadContextByAccountId = (id: string) => load({ id });
