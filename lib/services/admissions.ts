import { prisma, transact, nextSequence, type Db, type Tx } from "@/lib/db";
import { audit } from "@/lib/audit";
import { badRequest, conflict, notFound, unprocessable } from "@/lib/errors";
import { calculateAccountLedger } from "@/lib/services/finance";
import { getIdentityProvider } from "@/lib/auth/identity";
import { generateTempPassword } from "@/lib/auth/passwords";
import { env } from "@/lib/env";
import {
  ApplicationStatus,
  EnquirySource,
  EnquiryStatus,
  Gender,
  LostReason,
} from "@prisma/client";

// ───────────────────────── Enquiry ─────────────────────────

export interface CreateEnquiryInput {
  studentName: string;
  guardianName: string;
  phone: string;
  email?: string | null;
  academicYearId?: string | null;
  classId?: string | null;
  source?: EnquirySource;
  message?: string | null;
  assignedTo?: string | null;
}

export async function createEnquiry(db: Db, input: CreateEnquiryInput, actorId?: string) {
  return await transact(async (tx) => {
    const seq = await nextSequence(tx, "ENQUIRY_NO");
    const number = `ENQ-${new Date().getFullYear()}-${String(seq).padStart(5, "0")}`;

    const enquiry = await tx.enquiry.create({
      data: {
        number,
        studentName: input.studentName.trim(),
        guardianName: input.guardianName.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim().toLowerCase() || null,
        academicYearId: input.academicYearId || null,
        classId: input.classId || null,
        source: input.source || "WEBSITE",
        status: "NEW",
        message: input.message?.trim() || null,
        assignedTo: input.assignedTo || null,
      },
    });

    await audit(tx, {
      actorId,
      action: "ENQUIRY_CREATED",
      entityType: "Enquiry",
      entityId: enquiry.id,
      summary: `Created enquiry ${enquiry.number} for ${enquiry.studentName}`,
    });

    return enquiry;
  });
}

export async function markEnquiryLost(
  db: Db,
  enquiryId: string,
  reason: LostReason,
  note: string | undefined,
  actorId: string,
) {
  return await transact(async (tx) => {
    const enquiry = await tx.enquiry.findUnique({ where: { id: enquiryId } });
    if (!enquiry) throw notFound("Enquiry");

    const updated = await tx.enquiry.update({
      where: { id: enquiryId },
      data: {
        status: "LOST",
        lostReason: reason,
        lostNote: note?.trim() || null,
      },
    });

    await audit(tx, {
      actorId,
      action: "ENQUIRY_LOST",
      entityType: "Enquiry",
      entityId: enquiryId,
      summary: `Marked enquiry ${enquiry.number} as lost (${reason})`,
    });

    return updated;
  });
}

// ───────────────────────── Application ─────────────────────────

export interface CreateApplicationInput {
  enquiryId?: string | null;
  academicYearId: string;
  classId: string;
  sectionId?: string | null;
  streamId?: string | null;
  studentFirstName: string;
  studentLastName: string;
  dateOfBirth?: Date | null;
  gender?: Gender | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  previousSchool?: string | null;
  previousClass?: string | null;
  transferCertificateNo?: string | null;
  source?: EnquirySource;
  subjectIds?: string[];
  guardians: {
    name: string;
    relation: string;
    phone: string;
    email?: string | null;
    occupation?: string | null;
    isPrimary?: boolean;
  }[];
}

export async function createApplication(db: Db, input: CreateApplicationInput, actorId: string) {
  return await transact(async (tx) => {
    const year = await tx.academicYear.findUnique({ where: { id: input.academicYearId } });
    if (!year) throw notFound("Academic year");

    const cls = await tx.schoolClass.findUnique({ where: { id: input.classId } });
    if (!cls) throw notFound("Class");

    const seq = await nextSequence(tx, "APP_NO");
    const number = `APP-${new Date().getFullYear()}-${String(seq).padStart(5, "0")}`;

    const app = await tx.application.create({
      data: {
        number,
        enquiryId: input.enquiryId || null,
        academicYearId: input.academicYearId,
        classId: input.classId,
        sectionId: input.sectionId || null,
        streamId: input.streamId || null,
        studentFirstName: input.studentFirstName.trim(),
        studentLastName: input.studentLastName.trim(),
        dateOfBirth: input.dateOfBirth || null,
        gender: input.gender || null,
        email: input.email?.trim().toLowerCase() || null,
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        previousSchool: input.previousSchool?.trim() || null,
        previousClass: input.previousClass?.trim() || null,
        transferCertificateNo: input.transferCertificateNo?.trim() || null,
        source: input.source || "WALK_IN",
        status: "DRAFT",
        createdBy: actorId,
        guardians: {
          create: input.guardians.map((g) => ({
            name: g.name.trim(),
            relation: g.relation.trim(),
            phone: g.phone.trim(),
            email: g.email?.trim().toLowerCase() || null,
            occupation: g.occupation?.trim() || null,
            isPrimary: g.isPrimary || false,
          })),
        },
        subjects: input.subjectIds?.length
          ? {
              create: input.subjectIds.map((csId) => ({ classSubjectId: csId })),
            }
          : undefined,
      },
    });

    // Create connected FeeAccount right away
    await tx.feeAccount.create({
      data: {
        applicationId: app.id,
      },
    });

    if (input.enquiryId) {
      await tx.enquiry.update({
        where: { id: input.enquiryId },
        data: { status: "APPLIED" },
      });
    }

    await audit(tx, {
      actorId,
      action: "APPLICATION_CREATED",
      entityType: "Application",
      entityId: app.id,
      summary: `Created application ${app.number} for ${app.studentFirstName} ${app.studentLastName}`,
    });

    return app;
  });
}

// ───────────────────────── Assign Fee Plan to Application ─────────────────────────

export async function assignFeePlanToApplication(
  db: Db,
  applicationId: string,
  feePlanId: string,
  actorId: string,
) {
  return await transact(async (tx) => {
    const app = await tx.application.findUnique({
      where: { id: applicationId },
      include: { feeAccount: true },
    });
    if (!app) throw notFound("Application");
    if (!app.feeAccount) throw unprocessable("Application is missing a fee account");

    const plan = await tx.feePlan.findUnique({
      where: { id: feePlanId },
      include: {
        items: {
          include: { installments: true },
        },
      },
    });
    if (!plan) throw notFound("Fee Plan");

    // Remove old charges that haven't received payments/concessions
    const existingCharges = await tx.feeCharge.findMany({
      where: { feeAccountId: app.feeAccount.id },
      include: { paymentAllocations: true, concessionAllocations: true },
    });

    const hasAllocations = existingCharges.some(
      (c) => c.paymentAllocations.length > 0 || c.concessionAllocations.length > 0,
    );
    if (hasAllocations) {
      throw conflict("Cannot change fee plan: existing charges already have payments or concessions");
    }

    // Delete previous unallocated charges
    await tx.feeCharge.deleteMany({
      where: { feeAccountId: app.feeAccount.id },
    });

    // Create new charges from plan installments
    for (const item of plan.items) {
      for (const inst of item.installments) {
        await tx.feeCharge.create({
          data: {
            feeAccountId: app.feeAccount.id,
            academicYearId: app.academicYearId,
            feePlanInstallmentId: inst.id,
            feeHeadId: item.feeHeadId,
            label: inst.label,
            amount: inst.amount,
            dueDate: inst.dueDate,
            mandatoryForAdmission: inst.mandatoryForAdmission,
            createdBy: actorId,
          },
        });
      }
    }

    const updated = await tx.application.update({
      where: { id: applicationId },
      data: {
        feePlanId,
        status: "IN_REVIEW",
      },
    });

    await audit(tx, {
      actorId,
      action: "FEE_PLAN_ASSIGNED",
      entityType: "Application",
      entityId: applicationId,
      summary: `Assigned fee plan ${plan.name} to application ${app.number}`,
    });

    return updated;
  });
}

// ───────────────────────── Accounts Financial Clearance ─────────────────────────

export async function grantFinancialClearance(db: Db, applicationId: string, actorId: string) {
  return await transact(async (tx) => {
    const app = await tx.application.findUnique({
      where: { id: applicationId },
      include: { feeAccount: true },
    });
    if (!app) throw notFound("Application");
    if (!app.feeAccount) throw unprocessable("Application missing fee account");

    const ledger = await calculateAccountLedger(tx, app.feeAccount.id);
    if (!ledger.isClearedForAdmission) {
      throw unprocessable(
        `Mandatory admission charges not covered. Required: ₹${ledger.mandatoryChargesTotal}, Covered: ₹${ledger.mandatoryChargesPaidOrCovered}`,
      );
    }

    const updated = await tx.application.update({
      where: { id: applicationId },
      data: {
        status: "CLEARED",
        clearedAt: new Date(),
        clearedBy: actorId,
      },
    });

    await audit(tx, {
      actorId,
      action: "FINANCIAL_CLEARANCE_GRANTED",
      entityType: "Application",
      entityId: applicationId,
      summary: `Granted financial clearance to application ${app.number}`,
    });

    return updated;
  });
}

// ───────────────────────── Final Enrollment & Account Provisioning ─────────────────────────

export interface EnrollStudentInput {
  applicationId: string;
  sectionId: string;
  rollNumber?: number | null;
  subjectIds?: string[];
}

export async function enrollStudent(db: Db, input: EnrollStudentInput, actorId: string) {
  // 1. Transactional check and student record creation
  const enrolledData = await transact(async (tx) => {
    const app = await tx.application.findUnique({
      where: { id: input.applicationId },
      include: {
        feeAccount: true,
        guardians: true,
        subjects: true,
        class: true,
      },
    });
    if (!app) throw notFound("Application");
    if (app.status !== "CLEARED") {
      throw unprocessable(`Cannot enroll application in status ${app.status}. Financial clearance is required.`);
    }

    const section = await tx.section.findUnique({
      where: { id: input.sectionId },
      include: { enrollments: { where: { status: "ACTIVE" } } },
    });
    if (!section) throw notFound("Section");
    if (section.classId !== app.classId) {
      throw badRequest("Selected section does not belong to the application class");
    }

    // Check capacity
    if (section.enrollments.length >= section.capacity) {
      throw conflict(`Section ${section.name} is at full capacity (${section.capacity})`);
    }

    // Check roll number uniqueness if supplied
    if (input.rollNumber) {
      const existingRoll = await tx.enrollment.findFirst({
        where: {
          sectionId: input.sectionId,
          rollNumber: input.rollNumber,
          status: "ACTIVE",
        },
      });
      if (existingRoll) throw conflict(`Roll number ${input.rollNumber} is already taken in this section`);
    }

    // Allocate permanent admission number
    const seq = await nextSequence(tx, "ADMISSION_NO");
    const admissionNumber = `ADM-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`;

    // Synthetic or registered email for authentication
    const authEmail = app.email
      ? app.email.toLowerCase()
      : `${admissionNumber.toLowerCase()}@${env.internalAuthDomain}`;

    // Create Account record (pending provisioning)
    const account = await tx.account.create({
      data: {
        authEmail,
        registeredEmail: app.email ? app.email.toLowerCase() : null,
        kind: "STUDENT",
        status: "ACTIVE",
        displayName: `${app.studentFirstName} ${app.studentLastName}`.trim(),
        phone: app.phone || null,
        provisioning: "PENDING",
        mustChangePassword: true,
      },
    });

    // Create Student record
    const student = await tx.student.create({
      data: {
        admissionNumber,
        accountId: account.id,
        firstName: app.studentFirstName,
        lastName: app.studentLastName,
        dateOfBirth: app.dateOfBirth,
        gender: app.gender,
        address: app.address,
        phone: app.phone,
        previousSchool: app.previousSchool,
        previousClass: app.previousClass,
        transferCertificateNo: app.transferCertificateNo,
        joinedOn: new Date(),
        status: "ACTIVE",
        applicationId: app.id,
      },
    });

    // Re-link guardians and FeeAccount to student
    await tx.guardian.updateMany({
      where: { applicationId: app.id },
      data: { studentId: student.id },
    });

    if (app.feeAccount) {
      await tx.feeAccount.update({
        where: { id: app.feeAccount.id },
        data: { studentId: student.id },
      });
    }

    // Determine enrolled subjects (all CORE subjects of class + chosen electives/streams)
    const classSubjects = await tx.classSubject.findMany({
      where: { classId: app.classId },
    });

    const chosenSubjectIds = new Set(
      input.subjectIds || app.subjects.map((s) => s.classSubjectId),
    );

    const enrollmentSubjectsToCreate = classSubjects.filter(
      (cs) => cs.type === "CORE" || chosenSubjectIds.has(cs.id),
    );

    // Create enrollment
    const enrollment = await tx.enrollment.create({
      data: {
        studentId: student.id,
        academicYearId: app.academicYearId,
        classId: app.classId,
        sectionId: section.id,
        rollNumber: input.rollNumber || null,
        streamId: app.streamId || null,
        status: "ACTIVE",
        startedOn: new Date(),
        subjectsConfirmed: true,
        subjects: {
          create: enrollmentSubjectsToCreate.map((cs) => ({
            classSubjectId: cs.id,
          })),
        },
        placements: {
          create: {
            sectionId: section.id,
            rollNumber: input.rollNumber || null,
            fromDate: new Date(),
            reason: "Initial Enrollment",
          },
        },
      },
    });

    // Update application status
    await tx.application.update({
      where: { id: app.id },
      data: {
        status: "ENROLLED",
        enrolledAt: new Date(),
      },
    });

    if (app.enquiryId) {
      await tx.enquiry.update({
        where: { id: app.enquiryId },
        data: { status: "ENROLLED" },
      });
    }

    await audit(tx, {
      actorId,
      action: "STUDENT_ENROLLED",
      entityType: "Student",
      entityId: student.id,
      summary: `Enrolled student ${student.firstName} ${student.lastName} (Adm No: ${student.admissionNumber}) in Class ${app.class.name} Sec ${section.name}`,
    });

    return { account, student, enrollment, admissionNumber, authEmail };
  });

  // 2. Identity Provisioning (Retryable & resilient)
  const tempPassword = generateTempPassword();
  try {
    const idProvider = getIdentityProvider();
    const { authUserId } = await idProvider.ensureIdentity({
      authEmail: enrolledData.authEmail,
      password: tempPassword,
      displayName: enrolledData.account.displayName,
      accountId: enrolledData.account.id,
    });

    await prisma.account.update({
      where: { id: enrolledData.account.id },
      data: {
        authUserId,
        provisioning: "PROVISIONED",
        provisioningAttempts: { increment: 1 },
        lastProvisionAttemptAt: new Date(),
      },
    });
  } catch (err: any) {
    // Record provisioning error for visibility and retry
    await prisma.account.update({
      where: { id: enrolledData.account.id },
      data: {
        provisioning: "FAILED",
        provisioningAttempts: { increment: 1 },
        provisioningError: err?.message || "Failed to provision identity",
        lastProvisionAttemptAt: new Date(),
      },
    });
  }

  return {
    ...enrolledData,
    tempPassword,
  };
}

export async function retryAccountProvisioning(db: Db, accountId: string, actorId: string) {
  const account = await db.account.findUnique({
    where: { id: accountId },
    include: { student: true },
  });
  if (!account) throw notFound("Account");

  const tempPassword = generateTempPassword();
  try {
    const idProvider = getIdentityProvider();
    const { authUserId } = await idProvider.ensureIdentity({
      authEmail: account.authEmail,
      password: tempPassword,
      displayName: account.displayName,
      accountId: account.id,
    });

    const updated = await db.account.update({
      where: { id: account.id },
      data: {
        authUserId,
        provisioning: "PROVISIONED",
        provisioningError: null,
        provisioningAttempts: { increment: 1 },
        lastProvisionAttemptAt: new Date(),
      },
    });

    await audit(db, {
      actorId,
      action: "ACCOUNT_PROVISION_RETRY_SUCCESS",
      entityType: "Account",
      entityId: account.id,
      summary: `Successfully reprovisioned auth identity for ${account.displayName}`,
    });

    return { success: true, tempPassword, account: updated };
  } catch (err: any) {
    await db.account.update({
      where: { id: account.id },
      data: {
        provisioning: "FAILED",
        provisioningError: err?.message || "Retry failed",
        provisioningAttempts: { increment: 1 },
        lastProvisionAttemptAt: new Date(),
      },
    });
    throw unprocessable(`Provisioning failed: ${err?.message || "Unknown error"}`);
  }
}
