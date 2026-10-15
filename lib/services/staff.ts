import { prisma, transact, type Db, type Tx } from "@/lib/db";
import { audit } from "@/lib/audit";
import { badRequest, conflict, notFound } from "@/lib/errors";
import { Position } from "@prisma/client";

export interface CreateStaffInput {
  displayName: string;
  authEmail: string;
  phone?: string | null;
  employeeCode?: string | null;
  designation?: string | null;
  joinedOn?: Date | null;
}

export async function createStaffAccount(db: Db, input: CreateStaffInput, actorId?: string) {
  const email = input.authEmail.toLowerCase().trim();
  const existing = await db.account.findFirst({
    where: {
      OR: [{ authEmail: email }, { registeredEmail: email }],
    },
  });
  if (existing) {
    throw conflict("An account with this email already exists");
  }

  const account = await db.account.create({
    data: {
      authEmail: email,
      registeredEmail: email,
      displayName: input.displayName.trim(),
      phone: input.phone?.trim() || null,
      kind: "STAFF",
      status: "ACTIVE",
      provisioning: "PENDING",
      mustChangePassword: true,
      staffProfile: {
        create: {
          employeeCode: input.employeeCode?.trim() || null,
          designation: input.designation?.trim() || null,
          joinedOn: input.joinedOn || null,
        },
      },
    },
    include: { staffProfile: true },
  });

  await audit(db, {
    actorId,
    action: "STAFF_ACCOUNT_CREATED",
    entityType: "Account",
    entityId: account.id,
    summary: `Created staff account for ${account.displayName} (${account.authEmail})`,
  });

  return account;
}

export interface AssignPositionInput {
  accountId: string;
  position: Position;
  academicYearId?: string | null;
  classId?: string | null;
  sectionId?: string | null;
  offeringId?: string | null;
}

export async function assignPosition(db: Db, input: AssignPositionInput, actorId?: string) {
  return await transact(async (tx) => {
    const account = await tx.account.findUnique({
      where: { id: input.accountId },
      include: { staffProfile: true },
    });
    if (!account) throw notFound("Staff account");
    if (account.kind !== "STAFF") throw badRequest("Only staff accounts can hold positions");
    if (account.status !== "ACTIVE") throw badRequest("Inactive staff accounts cannot receive assignments");

    // Validate scope requirements
    if (["STAKEHOLDER", "PRINCIPAL", "ACCOUNTS", "ADMISSIONS"].includes(input.position)) {
      if (input.classId || input.sectionId || input.offeringId) {
        throw badRequest("School-wide positions cannot be scoped to a class, section, or subject offering");
      }
      const existing = await tx.positionAssignment.findFirst({
        where: { accountId: input.accountId, position: input.position, endedAt: null },
      });
      if (existing) throw conflict(`Staff member already holds active position ${input.position}`);
    } else if (input.position === "TEACHER_INCHARGE") {
      if (!input.classId || input.sectionId || input.offeringId) {
        throw badRequest("Teacher Incharge must be assigned to a class only");
      }
      const activeForClass = await tx.positionAssignment.findFirst({
        where: { classId: input.classId, position: "TEACHER_INCHARGE", endedAt: null },
      });
      if (activeForClass) {
        throw conflict("An active Teacher Incharge is already assigned to this class. Reassign or remove them first.");
      }
    } else if (input.position === "SECTION_HEAD") {
      if (!input.sectionId || input.offeringId) {
        throw badRequest("Section Head must be assigned to a section only");
      }
      const activeForSection = await tx.positionAssignment.findFirst({
        where: { sectionId: input.sectionId, position: "SECTION_HEAD", endedAt: null },
      });
      if (activeForSection) {
        throw conflict("An active Section Head is already assigned to this section. Reassign or remove them first.");
      }
    } else if (input.position === "SUBJECT_TEACHER") {
      if (!input.offeringId) {
        throw badRequest("Subject teacher must be assigned to a specific section–subject offering");
      }
      const activeForOffering = await tx.positionAssignment.findFirst({
        where: { offeringId: input.offeringId, position: "SUBJECT_TEACHER", endedAt: null },
      });
      if (activeForOffering) {
        throw conflict("An active Subject Teacher is already assigned to this offering. Reassign or remove them first.");
      }
    }

    const assignment = await tx.positionAssignment.create({
      data: {
        accountId: input.accountId,
        position: input.position,
        academicYearId: input.academicYearId || null,
        classId: input.classId || null,
        sectionId: input.sectionId || null,
        offeringId: input.offeringId || null,
        assignedBy: actorId || null,
      },
    });

    await audit(tx, {
      actorId,
      action: "POSITION_ASSIGNED",
      entityType: "PositionAssignment",
      entityId: assignment.id,
      summary: `Assigned position ${input.position} to account ${input.accountId}`,
      data: input as any,
    });

    return assignment;
  });
}

export async function removePositionAssignment(
  db: Db,
  assignmentId: string,
  reason?: string,
  actorId?: string,
) {
  return await transact(async (tx) => {
    const existing = await tx.positionAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!existing) throw notFound("Position assignment");
    if (existing.endedAt) throw badRequest("Position assignment is already ended");

    const updated = await tx.positionAssignment.update({
      where: { id: assignmentId },
      data: {
        endedAt: new Date(),
        endReason: reason || "Manual removal",
        endedBy: actorId || null,
      },
    });

    await audit(tx, {
      actorId,
      action: "POSITION_REMOVED",
      entityType: "PositionAssignment",
      entityId: assignmentId,
      summary: `Ended position ${existing.position} for account ${existing.accountId}`,
      data: { reason },
    });

    return updated;
  });
}

export async function setAccountStatus(
  db: Db,
  accountId: string,
  status: "ACTIVE" | "INACTIVE",
  actorId?: string,
) {
  return await transact(async (tx) => {
    const account = await tx.account.findUnique({ where: { id: accountId } });
    if (!account) throw notFound("Account");
    if (account.status === status) return account;

    const updated = await tx.account.update({
      where: { id: accountId },
      data: {
        status,
        deactivatedAt: status === "INACTIVE" ? new Date() : null,
      },
    });

    await audit(tx, {
      actorId,
      action: status === "ACTIVE" ? "ACCOUNT_ACTIVATED" : "ACCOUNT_DEACTIVATED",
      entityType: "Account",
      entityId: accountId,
      summary: `Account ${account.displayName} status changed to ${status}`,
    });

    return updated;
  });
}
