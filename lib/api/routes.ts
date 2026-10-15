import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, notFound, unauthorized } from "@/lib/errors";
import { getIdentityProvider, resolveAuthUserId } from "@/lib/auth/identity";
import { passwordProblems } from "@/lib/auth/passwords";
import { hit } from "@/lib/rate-limit";
import {
  publicRoute,
  route,
  routeAllowingTempPassword,
} from "@/lib/api/registry";
import {
  assignPosition,
  createStaffAccount,
  removePositionAssignment,
  setAccountStatus,
} from "@/lib/services/staff";
import {
  addClassSubject,
  createAcademicYear,
  createClass,
  createSection,
  createSubject,
  setAcademicYearStatus,
} from "@/lib/services/academics";
import {
  calculateAccountLedger,
  calculateMonthlyPayroll,
  decideConcession,
  finalizePayroll,
  proposeConcession,
  recordExpense,
  recordPayment,
  recordPayrollPayment,
  reverseExpense,
  reversePayment,
} from "@/lib/services/finance";
import {
  assignFeePlanToApplication,
  createApplication,
  createEnquiry,
  enrollStudent,
  grantFinancialClearance,
  markEnquiryLost,
  retryAccountProvisioning,
} from "@/lib/services/admissions";
import {
  correctAttendanceRecord,
  createCoursework,
  createExam,
  enterStudentMark,
  preparePromotionDecision,
  confirmPromotionDecision,
  publishExamResults,
  recordPhysicalSubmission,
  recordSectionAttendance,
  reopenExam,
} from "@/lib/services/operations";
import {
  evaluateAcademicAlerts,
  getAdmissionsConversionReport,
  getStakeholderFinancialSummary,
  getTopStudentsRanking,
} from "@/lib/services/reporting";
import { D, round2 } from "@/lib/money";

// ───────────────────────── Authentication Routes ─────────────────────────

publicRoute.post("/auth/login", async ({ req, ip, cookies, readCookies, json }) => {
  const allowed = hit(`login:${ip}`, 15, 60_000);
  if (!allowed) throw badRequest("Too many login attempts. Please wait a minute.");

  const body = await json(
    z.object({
      identifier: z.string().trim().min(1, "Identifier required"),
      password: z.string().min(1, "Password required"),
    }),
  );

  const rawIdent = body.identifier.trim();

  // Resolve identifier: Could be email or admission number
  let targetEmail = rawIdent.toLowerCase();
  const student = await prisma.student.findUnique({
    where: { admissionNumber: rawIdent.toUpperCase() },
    include: { account: true },
  });

  if (student && student.account) {
    targetEmail = student.account.authEmail.toLowerCase();
  }

  const idProvider = getIdentityProvider();
  const authUserId = await idProvider.signIn(targetEmail, body.password, cookies, readCookies);
  if (!authUserId) {
    throw unauthorized("Invalid username, admission number, or password");
  }

  // Check account status
  const account = await prisma.account.findUnique({
    where: { authEmail: targetEmail },
    include: {
      student: true,
      positions: { where: { endedAt: null } },
    },
  });

  if (!account || account.status !== "ACTIVE") {
    await idProvider.signOut(cookies, readCookies);
    throw unauthorized("This account is inactive or disabled");
  }

  // Update last login
  await prisma.account.update({
    where: { id: account.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    ok: true,
    user: {
      id: account.id,
      displayName: account.displayName,
      kind: account.kind,
      mustChangePassword: account.mustChangePassword,
      positions: account.positions.map((p) => p.position),
      student: account.student
        ? {
            id: account.student.id,
            admissionNumber: account.student.admissionNumber,
          }
        : null,
    },
  };
});

routeAllowingTempPassword.post("/auth/change-password", async ({ ctx, json }) => {
  const body = await json(
    z.object({
      currentPassword: z.string().optional(),
      newPassword: z.string().min(8),
    }),
  );

  const prob = passwordProblems(body.newPassword);
  if (prob) throw badRequest(prob);

  const idProvider = getIdentityProvider();
  if (ctx.account.authUserId) {
    await idProvider.setPassword(ctx.account.authUserId, body.newPassword);
  }

  await prisma.account.update({
    where: { id: ctx.account.id },
    data: { mustChangePassword: false },
  });

  return { ok: true, message: "Password updated successfully" };
});

routeAllowingTempPassword.post("/auth/logout", async ({ cookies, readCookies }) => {
  const idProvider = getIdentityProvider();
  await idProvider.signOut(cookies, readCookies);
  return { ok: true };
});

routeAllowingTempPassword.get("/auth/me", async ({ ctx }) => {
  const account = await prisma.account.findUnique({
    where: { id: ctx.account.id },
    include: {
      student: {
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            include: {
              class: true,
              section: true,
            },
          },
        },
      },
      positions: {
        where: { endedAt: null },
        include: {
          class: true,
          section: true,
          offering: {
            include: {
              classSubject: { include: { subject: true } },
              section: { include: { class: true } },
            },
          },
        },
      },
    },
  });

  if (!account) throw notFound("Account");

  return {
    account: {
      id: account.id,
      displayName: account.displayName,
      authEmail: account.authEmail,
      registeredEmail: account.registeredEmail,
      kind: account.kind,
      mustChangePassword: account.mustChangePassword,
    },
    positions: account.positions,
    student: account.student,
  };
});

// ───────────────────────── Public Website ─────────────────────────

publicRoute.get("/public/school", async () => {
  let school = await prisma.school.findUnique({ where: { id: "school" } });
  if (!school) {
    school = await prisma.school.create({
      data: {
        name: "5 Point Engineering High School",
        shortName: "5-Point",
        tagline: "Excellence in Comprehensive Engineering & Academic Education",
        admissionPrefix: "ADM",
      },
    });
  }

  let stats = null;
  if (school.showPublicStats) {
    const studentCount = await prisma.student.count({ where: { status: "ACTIVE" } });
    const teacherCount = await prisma.account.count({
      where: { kind: "STAFF", status: "ACTIVE" },
    });
    stats = { studentCount, teacherCount };
  }

  return { school, stats };
});

publicRoute.post("/public/enquiry", async ({ ip, json }) => {
  const allowed = hit(`enquiry:${ip}`, 10, 60_000);
  if (!allowed) throw badRequest("Too many enquiry submissions. Please try again later.");

  const body = await json(
    z.object({
      studentName: z.string().trim().min(1),
      guardianName: z.string().trim().min(1),
      phone: z.string().trim().min(6),
      email: z.string().email().optional().nullable(),
      academicYearId: z.string().optional().nullable(),
      classId: z.string().optional().nullable(),
      message: z.string().optional().nullable(),
    }),
  );

  const enquiry = await createEnquiry(prisma, {
    ...body,
    source: "WEBSITE",
  });

  return { ok: true, enquiryNumber: enquiry.number };
});

// ───────────────────────── Staff & Positions (Stakeholder / Principal) ─────────────────────────

route.get("/staff", ["STAKEHOLDER", "PRINCIPAL"], async () => {
  const staff = await prisma.account.findMany({
    where: { kind: "STAFF" },
    include: {
      staffProfile: true,
      positions: {
        where: { endedAt: null },
        include: {
          class: true,
          section: true,
          offering: {
            include: {
              classSubject: { include: { subject: true } },
              section: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return staff;
});

route.post("/staff", ["STAKEHOLDER"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      displayName: z.string().trim().min(1),
      authEmail: z.string().email(),
      phone: z.string().optional().nullable(),
      employeeCode: z.string().optional().nullable(),
      designation: z.string().optional().nullable(),
      joinedOn: z.string().optional().nullable(),
    }),
  );

  const joinedOn = body.joinedOn ? new Date(body.joinedOn) : null;
  const staff = await createStaffAccount(prisma, { ...body, joinedOn }, ctx.account.id);
  return staff;
});

route.post("/staff/assign-position", ["STAKEHOLDER", "PRINCIPAL", "TEACHER_INCHARGE"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      accountId: z.string().uuid(),
      position: z.enum([
        "STAKEHOLDER",
        "PRINCIPAL",
        "TEACHER_INCHARGE",
        "SECTION_HEAD",
        "SUBJECT_TEACHER",
        "ACCOUNTS",
        "ADMISSIONS",
      ]),
      academicYearId: z.string().uuid().optional().nullable(),
      classId: z.string().uuid().optional().nullable(),
      sectionId: z.string().uuid().optional().nullable(),
      offeringId: z.string().uuid().optional().nullable(),
    }),
  );

  // Incharges can only assign Section Head and Subject Teacher within their assigned classes
  if (ctx.has("TEACHER_INCHARGE") && !ctx.has("STAKEHOLDER", "PRINCIPAL")) {
    if (!["SECTION_HEAD", "SUBJECT_TEACHER"].includes(body.position)) {
      throw badRequest("Teacher Incharge can only assign Section Heads and Subject Teachers");
    }
  }

  const assignment = await assignPosition(prisma, body, ctx.account.id);
  return assignment;
});

route.post("/staff/remove-position", ["STAKEHOLDER", "PRINCIPAL", "TEACHER_INCHARGE"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      assignmentId: z.string().uuid(),
      reason: z.string().optional(),
    }),
  );

  const updated = await removePositionAssignment(prisma, body.assignmentId, body.reason, ctx.account.id);
  return updated;
});

route.post("/staff/set-status", ["STAKEHOLDER"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      accountId: z.string().uuid(),
      status: z.enum(["ACTIVE", "INACTIVE"]),
    }),
  );

  const updated = await setAccountStatus(prisma, body.accountId, body.status, ctx.account.id);
  return updated;
});

// ───────────────────────── Academic Setup ─────────────────────────

route.get("/academic-years", "staff", async () => {
  return await prisma.academicYear.findMany({
    include: {
      classes: {
        include: {
          sections: true,
          classSubjects: { include: { subject: true } },
        },
      },
    },
    orderBy: { startDate: "desc" },
  });
});

route.post("/academic-years", ["STAKEHOLDER", "PRINCIPAL"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      name: z.string().trim().min(1),
      startDate: z.string(),
      endDate: z.string(),
      status: z.enum(["PLANNED", "ACTIVE", "CLOSED"]).optional(),
    }),
  );

  return await createAcademicYear(
    prisma,
    {
      name: body.name,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      status: body.status,
    },
    ctx.account.id,
  );
});

route.post("/academic-years/:id/status", ["STAKEHOLDER", "PRINCIPAL"], async ({ ctx, params, json }) => {
  const body = await json(
    z.object({
      status: z.enum(["PLANNED", "ACTIVE", "CLOSED"]),
    }),
  );
  return await setAcademicYearStatus(prisma, params.id, body.status, ctx.account.id);
});

route.post("/classes", ["STAKEHOLDER", "PRINCIPAL"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      academicYearId: z.string().uuid(),
      name: z.string().trim().min(1),
      level: z.number().int(),
      hasStreams: z.boolean().optional(),
    }),
  );
  return await createClass(prisma, body, ctx.account.id);
});

route.post("/sections", ["STAKEHOLDER", "PRINCIPAL"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      classId: z.string().uuid(),
      name: z.string().trim().min(1),
      capacity: z.number().int().positive().optional(),
      room: z.string().optional().nullable(),
    }),
  );
  return await createSection(prisma, body, ctx.account.id);
});

route.post("/subjects", ["STAKEHOLDER", "PRINCIPAL"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      code: z.string().trim().min(1),
      name: z.string().trim().min(1),
      description: z.string().optional().nullable(),
    }),
  );
  return await createSubject(prisma, body, ctx.account.id);
});

route.post("/class-subjects", ["STAKEHOLDER", "PRINCIPAL"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      classId: z.string().uuid(),
      subjectId: z.string().uuid(),
      type: z.enum(["CORE", "STREAM", "ELECTIVE"]),
      streamId: z.string().uuid().optional().nullable(),
      electiveGroupId: z.string().uuid().optional().nullable(),
      periodsPerWeek: z.number().int().nonnegative().optional(),
    }),
  );
  return await addClassSubject(prisma, body, ctx.account.id);
});

// ───────────────────────── Admissions & Enquiries ─────────────────────────

route.get("/enquiries", ["ADMISSIONS", "STAKEHOLDER", "PRINCIPAL"], async () => {
  return await prisma.enquiry.findMany({
    include: { academicYear: true, class: true, followUps: true, application: true },
    orderBy: { createdAt: "desc" },
  });
});

route.post("/enquiries", ["ADMISSIONS"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      studentName: z.string().trim().min(1),
      guardianName: z.string().trim().min(1),
      phone: z.string().trim().min(6),
      email: z.string().email().optional().nullable(),
      academicYearId: z.string().uuid().optional().nullable(),
      classId: z.string().uuid().optional().nullable(),
      source: z.enum(["WEBSITE", "WALK_IN", "PHONE", "REFERRAL", "SOCIAL_MEDIA", "ADVERTISEMENT", "OTHER"]).optional(),
      message: z.string().optional().nullable(),
    }),
  );
  return await createEnquiry(prisma, body, ctx.account.id);
});

route.post("/enquiries/:id/lost", ["ADMISSIONS"], async ({ ctx, params, json }) => {
  const body = await json(
    z.object({
      reason: z.enum(["FEES", "DISTANCE", "ADMITTED_ELSEWHERE", "NO_RESPONSE", "CURRICULUM", "OTHER"]),
      note: z.string().optional(),
    }),
  );
  return await markEnquiryLost(prisma, params.id, body.reason, body.note, ctx.account.id);
});

route.get("/applications", ["ADMISSIONS", "ACCOUNTS", "STAKEHOLDER", "PRINCIPAL"], async () => {
  return await prisma.application.findMany({
    include: {
      class: true,
      section: true,
      guardians: true,
      feePlan: true,
      feeAccount: true,
      student: true,
    },
    orderBy: { createdAt: "desc" },
  });
});

route.post("/applications", ["ADMISSIONS"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      enquiryId: z.string().uuid().optional().nullable(),
      academicYearId: z.string().uuid(),
      classId: z.string().uuid(),
      sectionId: z.string().uuid().optional().nullable(),
      streamId: z.string().uuid().optional().nullable(),
      studentFirstName: z.string().trim().min(1),
      studentLastName: z.string().trim().min(1),
      dateOfBirth: z.string().optional().nullable(),
      gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
      email: z.string().email().optional().nullable(),
      phone: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
      previousSchool: z.string().optional().nullable(),
      previousClass: z.string().optional().nullable(),
      transferCertificateNo: z.string().optional().nullable(),
      guardians: z.array(
        z.object({
          name: z.string().trim().min(1),
          relation: z.string().trim().min(1),
          phone: z.string().trim().min(6),
          email: z.string().email().optional().nullable(),
          occupation: z.string().optional().nullable(),
          isPrimary: z.boolean().optional(),
        }),
      ),
      subjectIds: z.array(z.string().uuid()).optional(),
    }),
  );

  const dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  return await createApplication(prisma, { ...body, dateOfBirth }, ctx.account.id);
});

route.post("/applications/:id/assign-fee-plan", ["ACCOUNTS"], async ({ ctx, params, json }) => {
  const body = await json(
    z.object({
      feePlanId: z.string().uuid(),
    }),
  );
  return await assignFeePlanToApplication(prisma, params.id, body.feePlanId, ctx.account.id);
});

route.post("/applications/:id/clearance", ["ACCOUNTS"], async ({ ctx, params }) => {
  return await grantFinancialClearance(prisma, params.id, ctx.account.id);
});

route.post("/applications/enroll", ["ADMISSIONS"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      applicationId: z.string().uuid(),
      sectionId: z.string().uuid(),
      rollNumber: z.number().int().positive().optional().nullable(),
      subjectIds: z.array(z.string().uuid()).optional(),
    }),
  );
  return await enrollStudent(prisma, body, ctx.account.id);
});

route.post("/accounts/:id/retry-provisioning", ["ADMISSIONS", "STAKEHOLDER"], async ({ ctx, params }) => {
  return await retryAccountProvisioning(prisma, params.id, ctx.account.id);
});

// ───────────────────────── Finance & Fees ─────────────────────────

route.get("/fee-accounts/:id/ledger", ["ACCOUNTS", "STAKEHOLDER", "PRINCIPAL", "ADMISSIONS"], async ({ params }) => {
  return await calculateAccountLedger(prisma, params.id);
});

route.post("/payments", ["ACCOUNTS"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      feeAccountId: z.string().uuid(),
      amount: z.union([z.string(), z.number()]),
      receivedOn: z.string(),
      method: z.enum(["CASH", "UPI", "CARD", "CHEQUE", "BANK_TRANSFER", "OTHER"]),
      reference: z.string().optional().nullable(),
      payerName: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      idempotencyKey: z.string().optional().nullable(),
    }),
  );

  return await recordPayment(
    prisma,
    {
      feeAccountId: body.feeAccountId,
      amount: D(body.amount),
      receivedOn: new Date(body.receivedOn),
      method: body.method,
      reference: body.reference,
      payerName: body.payerName,
      notes: body.notes,
      idempotencyKey: body.idempotencyKey,
    },
    ctx.account.id,
  );
});

route.post("/payments/:id/reverse", ["ACCOUNTS"], async ({ ctx, params, json }) => {
  const body = await json(
    z.object({
      reason: z.string().trim().min(1),
    }),
  );
  return await reversePayment(prisma, params.id, body.reason, ctx.account.id);
});

route.post("/concessions/propose", ["ACCOUNTS"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      feeAccountId: z.string().uuid(),
      type: z.enum(["SCHOLARSHIP", "DISCOUNT"]),
      mode: z.enum(["FIXED", "PERCENT"]),
      value: z.union([z.string(), z.number()]),
      reason: z.string().trim().min(1),
      scopeFeeHeadId: z.string().uuid().optional().nullable(),
      scopeChargeId: z.string().uuid().optional().nullable(),
    }),
  );
  return await proposeConcession(
    prisma,
    {
      ...body,
      value: D(body.value),
    },
    ctx.account.id,
  );
});

route.post("/concessions/:id/decide", ["STAKEHOLDER"], async ({ ctx, params, json }) => {
  const body = await json(
    z.object({
      decision: z.enum(["APPROVED", "REJECTED"]),
      note: z.string().optional(),
    }),
  );
  return await decideConcession(prisma, params.id, body.decision, body.note, ctx.account.id);
});

route.get("/expenses", ["ACCOUNTS", "STAKEHOLDER"], async () => {
  return await prisma.expense.findMany({
    include: { category: true },
    orderBy: { spentOn: "desc" },
  });
});

route.post("/expenses", ["ACCOUNTS"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      categoryId: z.string().uuid(),
      amount: z.union([z.string(), z.number()]),
      spentOn: z.string(),
      paidTo: z.string().trim().min(1),
      method: z.enum(["CASH", "UPI", "CARD", "CHEQUE", "BANK_TRANSFER", "OTHER"]),
      reference: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    }),
  );
  return await recordExpense(
    prisma,
    {
      ...body,
      amount: D(body.amount),
      spentOn: new Date(body.spentOn),
    },
    ctx.account.id,
  );
});

route.post("/expenses/:id/reverse", ["ACCOUNTS"], async ({ ctx, params, json }) => {
  const body = await json(z.object({ reason: z.string().trim().min(1) }));
  return await reverseExpense(prisma, params.id, body.reason, ctx.account.id);
});

route.get("/payroll", ["ACCOUNTS", "STAKEHOLDER"], async () => {
  return await prisma.payrollRecord.findMany({
    include: { staff: { include: { account: true } }, lines: true },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
});

route.post("/payroll/calculate", ["ACCOUNTS"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
    }),
  );
  return await calculateMonthlyPayroll(prisma, body.year, body.month, ctx.account.id);
});

route.post("/payroll/:id/finalize", ["ACCOUNTS"], async ({ ctx, params }) => {
  return await finalizePayroll(prisma, params.id, ctx.account.id);
});

route.post("/payroll/:id/pay", ["ACCOUNTS"], async ({ ctx, params, json }) => {
  const body = await json(
    z.object({
      paidOn: z.string(),
      method: z.enum(["CASH", "UPI", "CARD", "CHEQUE", "BANK_TRANSFER", "OTHER"]),
      reference: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    }),
  );
  return await recordPayrollPayment(
    prisma,
    params.id,
    {
      paidOn: new Date(body.paidOn),
      method: body.method,
      reference: body.reference,
      notes: body.notes,
    },
    ctx.account.id,
  );
});

// ───────────────────────── Academic Operations & Teaching ─────────────────────────

route.post("/attendance", ["SECTION_HEAD"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      sectionId: z.string().uuid(),
      date: z.string(),
      records: z.array(
        z.object({
          enrollmentId: z.string().uuid(),
          status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE"]),
          remarks: z.string().optional().nullable(),
        }),
      ),
    }),
  );

  if (!ctx.headSectionIds.has(body.sectionId)) {
    throw badRequest("You are not the Section Teacher Head of this section");
  }

  return await recordSectionAttendance(
    prisma,
    {
      sectionId: body.sectionId,
      date: new Date(body.date),
      records: body.records,
    },
    ctx.account.id,
  );
});

route.post("/attendance/correct", ["TEACHER_INCHARGE", "PRINCIPAL"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      recordId: z.string().uuid(),
      newStatus: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE"]),
      reason: z.string().trim().min(1),
    }),
  );
  return await correctAttendanceRecord(prisma, body.recordId, body.newStatus, body.reason, ctx.account.id);
});

route.post("/coursework", ["SUBJECT_TEACHER"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      offeringId: z.string().uuid(),
      kind: z.enum(["HOMEWORK", "ASSIGNMENT"]),
      title: z.string().trim().min(1),
      instructions: z.string().trim().min(1),
      assignedOn: z.string(),
      dueDate: z.string(),
      maxMarks: z.union([z.string(), z.number()]).optional().nullable(),
    }),
  );

  if (!ctx.offeringIds.has(body.offeringId)) {
    throw badRequest("You are not the assigned subject teacher for this offering");
  }

  return await createCoursework(
    prisma,
    {
      offeringId: body.offeringId,
      kind: body.kind,
      title: body.title,
      instructions: body.instructions,
      assignedOn: new Date(body.assignedOn),
      dueDate: new Date(body.dueDate),
      maxMarks: body.maxMarks ? D(body.maxMarks) : null,
    },
    ctx.account.id,
  );
});

route.post("/coursework/submit", ["SUBJECT_TEACHER"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      courseworkId: z.string().uuid(),
      enrollmentId: z.string().uuid(),
      status: z.enum(["SUBMITTED", "LATE", "MISSING", "EXCUSED"]),
      marks: z.union([z.string(), z.number()]).optional().nullable(),
      feedback: z.string().optional().nullable(),
    }),
  );

  const res = await recordPhysicalSubmission(
    prisma,
    {
      courseworkId: body.courseworkId,
      enrollmentId: body.enrollmentId,
      status: body.status,
      marks: body.marks ? D(body.marks) : null,
      feedback: body.feedback,
    },
    ctx.account.id,
  );

  // Re-evaluate academic alerts
  await evaluateAcademicAlerts(prisma, body.enrollmentId);

  return res;
});

route.get("/exams", "staff", async () => {
  return await prisma.exam.findMany({
    include: {
      class: true,
      section: true,
      papers: {
        include: {
          classSubject: { include: { subject: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
});

route.post("/exams", ["TEACHER_INCHARGE", "PRINCIPAL"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      academicYearId: z.string().uuid(),
      classId: z.string().uuid(),
      scope: z.enum(["CLASS_WIDE", "SUBJECT_TEST"]),
      category: z.enum(["HALF_YEARLY", "ANNUAL", "UNIT_TEST", "OTHER"]).optional(),
      name: z.string().trim().min(1),
      sectionId: z.string().uuid().optional().nullable(),
      startDate: z.string().optional().nullable(),
      endDate: z.string().optional().nullable(),
      papers: z.array(
        z.object({
          classSubjectId: z.string().uuid(),
          maxMarks: z.union([z.string(), z.number()]),
          passMarks: z.union([z.string(), z.number()]),
          examDate: z.string().optional().nullable(),
        }),
      ),
    }),
  );

  return await createExam(
    prisma,
    {
      academicYearId: body.academicYearId,
      classId: body.classId,
      scope: body.scope,
      category: body.category,
      name: body.name,
      sectionId: body.sectionId,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      papers: body.papers.map((p) => ({
        classSubjectId: p.classSubjectId,
        maxMarks: D(p.maxMarks),
        passMarks: D(p.passMarks),
        examDate: p.examDate ? new Date(p.examDate) : null,
      })),
    },
    ctx.account.id,
  );
});

route.post("/exams/marks", ["SUBJECT_TEACHER", "TEACHER_INCHARGE"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      paperId: z.string().uuid(),
      enrollmentId: z.string().uuid(),
      status: z.enum(["ENTERED", "ABSENT", "EXEMPT"]),
      marks: z.union([z.string(), z.number()]).optional().nullable(),
    }),
  );

  return await enterStudentMark(
    prisma,
    {
      paperId: body.paperId,
      enrollmentId: body.enrollmentId,
      status: body.status,
      marks: body.marks ? D(body.marks) : null,
    },
    ctx.account.id,
  );
});

route.post("/exams/:id/publish", ["TEACHER_INCHARGE", "PRINCIPAL"], async ({ ctx, params }) => {
  const exam = await prisma.exam.findUnique({ where: { id: params.id } });
  if (!exam) throw notFound("Exam");
  if (ctx.has("TEACHER_INCHARGE") && !ctx.has("PRINCIPAL")) {
    if (!ctx.inchargeClassIds.has(exam.classId)) {
      throw badRequest("You are not the Incharge for this class");
    }
  }

  const published = await publishExamResults(prisma, params.id, ctx.account.id);

  // Evaluate academic alerts for class students
  const enrollments = await prisma.enrollment.findMany({
    where: { classId: exam.classId, status: "ACTIVE" },
  });
  for (const e of enrollments) {
    await evaluateAcademicAlerts(prisma, e.id);
  }

  return published;
});

route.post("/exams/:id/reopen", ["TEACHER_INCHARGE", "PRINCIPAL"], async ({ ctx, params, json }) => {
  const body = await json(z.object({ reason: z.string().trim().min(1) }));
  return await reopenExam(prisma, params.id, body.reason, ctx.account.id);
});

route.post("/promotions/prepare", ["TEACHER_INCHARGE"], async ({ ctx, json }) => {
  const body = await json(
    z.object({
      enrollmentId: z.string().uuid(),
      decision: z.enum(["PROMOTE", "RETAIN", "GRADUATE"]),
      toClassId: z.string().uuid().optional().nullable(),
      toSectionId: z.string().uuid().optional().nullable(),
      remarks: z.string().optional().nullable(),
    }),
  );
  return await preparePromotionDecision(prisma, body, ctx.account.id);
});

route.post("/promotions/:id/confirm", ["PRINCIPAL"], async ({ ctx, params, json }) => {
  const body = await json(
    z.object({
      targetAcademicYearId: z.string().uuid(),
    }),
  );
  return await confirmPromotionDecision(prisma, params.id, body.targetAcademicYearId, ctx.account.id);
});

// ───────────────────────── Student Portal ─────────────────────────

route.get("/student/overview", "student", async ({ ctx }) => {
  const student = await prisma.student.findUnique({
    where: { accountId: ctx.account.id },
    include: {
      feeAccount: true,
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          class: true,
          section: true,
          subjects: {
            include: {
              classSubject: { include: { subject: true } },
            },
          },
        },
      },
    },
  });
  if (!student) throw notFound("Student");

  const enr = student.enrollments[0];
  let ledger = null;
  if (student.feeAccount) {
    ledger = await calculateAccountLedger(prisma, student.feeAccount.id);
  }

  // Fetch upcoming work & recent notifications
  const notifications = await prisma.notification.findMany({
    where: { recipientId: ctx.account.id, state: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    student,
    enrollment: enr || null,
    ledger,
    notifications,
  };
});

// ───────────────────────── Notifications / Inbox ─────────────────────────

route.get("/notifications", "authenticated", async ({ ctx }) => {
  return await prisma.notification.findMany({
    where: { recipientId: ctx.account.id },
    orderBy: { createdAt: "desc" },
  });
});

route.post("/notifications/:id/resolve", "authenticated", async ({ ctx, params }) => {
  const notif = await prisma.notification.findUnique({ where: { id: params.id } });
  if (!notif || notif.recipientId !== ctx.account.id) throw notFound("Notification");

  return await prisma.notification.update({
    where: { id: params.id },
    data: { state: "RESOLVED", resolvedAt: new Date() },
  });
});

// ───────────────────────── Stakeholder Reporting ─────────────────────────

route.get("/reports/financial", ["STAKEHOLDER"], async ({ query }) => {
  const from = query.get("from") ? new Date(query.get("from")!) : undefined;
  const to = query.get("to") ? new Date(query.get("to")!) : undefined;
  const academicYearId = query.get("academicYearId") || undefined;
  return await getStakeholderFinancialSummary(prisma, { from, to, academicYearId });
});

route.get("/reports/admissions", ["STAKEHOLDER", "ADMISSIONS"], async ({ query }) => {
  const academicYearId = query.get("academicYearId") || undefined;
  return await getAdmissionsConversionReport(prisma, academicYearId);
});

route.get("/reports/top-students", ["STAKEHOLDER", "PRINCIPAL", "TEACHER_INCHARGE"], async ({ query }) => {
  const classId = query.get("classId");
  if (!classId) throw badRequest("classId query param is required");
  return await getTopStudentsRanking(prisma, classId);
});
