import { prisma, type Db } from "@/lib/db";
import { D, round2, sum, percentage, ZERO, type Dec } from "@/lib/money";
import { calculateAccountLedger } from "@/lib/services/finance";

// ───────────────────────── Academic Alerts Evaluation ─────────────────────────

export async function evaluateAcademicAlerts(db: Db, enrollmentId: string) {
  const settings = await db.alertSettings.findUnique({ where: { id: "alerts" } });
  if (!settings || !settings.enabled) return;

  const enr = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      student: { include: { account: true } },
      section: {
        include: {
          positions: {
            where: { position: "SECTION_HEAD", endedAt: null },
            include: { account: true },
          },
        },
      },
      class: true,
      subjects: {
        include: {
          classSubject: {
            include: {
              subject: true,
              offerings: {
                where: { section: { enrollments: { some: { id: enrollmentId } } } },
                include: {
                  positions: {
                    where: { position: "SUBJECT_TEACHER", endedAt: null },
                    include: { account: true },
                  },
                },
              },
            },
          },
        },
      },
      submissions: {
        include: { coursework: true },
      },
    },
  });
  if (!enr || !enr.student.account) return;

  const headAccount = enr.section.positions[0]?.account;

  // 1. Assignment completion calculation
  const reviewPeriodStart = new Date(Date.now() - settings.reviewPeriodDays * 86_400_000);
  const eligibleSubmissions = enr.submissions.filter(
    (s) =>
      s.coursework.assignedOn >= reviewPeriodStart &&
      s.status !== "EXCUSED", // Exclude excused
  );

  if (eligibleSubmissions.length >= settings.minEligibleRecords) {
    const completedCount = eligibleSubmissions.filter(
      (s) => s.status === "SUBMITTED" || s.status === "LATE",
    ).length;
    const rate = percentage(completedCount, eligibleSubmissions.length);

    if (rate.lessThan(D(settings.assignmentCompletionTarget))) {
      // Raise alert for student, section head, and teachers
      const recipients = [enr.student.account.id];
      if (headAccount) recipients.push(headAccount.id);

      const dedupeKey = `ALERT-ASSIGNMENT-${enr.id}-${new Date().toISOString().slice(0, 7)}`;
      const title = `Low Assignment Completion: ${enr.student.firstName} ${enr.student.lastName}`;
      const body = `Assignment completion rate is ${rate}% (target: ${settings.assignmentCompletionTarget}%) over the last ${settings.reviewPeriodDays} days.`;

      for (const recId of recipients) {
        await db.notification.upsert({
          where: {
            recipientId_dedupeKey: {
              recipientId: recId,
              dedupeKey,
            },
          },
          create: {
            recipientId: recId,
            kind: "ACADEMIC_ASSIGNMENT",
            severity: "WARNING",
            title,
            body,
            dedupeKey,
            state: "OPEN",
          },
          update: {
            title,
            body,
            state: "OPEN",
          },
        });
      }
    }
  }

  // 2. Exam performance alerts (latest published report card)
  if (settings.examAlertsEnabled) {
    const latestReport = await db.reportCard.findFirst({
      where: { enrollmentId: enr.id, isCurrent: true },
      include: {
        exam: true,
        lines: true,
      },
      orderBy: { publishedAt: "desc" },
    });

    if (latestReport && !latestReport.passed) {
      const failedSubjects = latestReport.lines.filter((l) => !l.passed).map((l) => l.subjectName);
      const dedupeKey = `ALERT-EXAM-${enr.id}-${latestReport.examId}`;
      const title = `Academic Performance Alert: ${latestReport.exam.name}`;
      const body = `${enr.student.firstName} did not achieve pass marks in: ${failedSubjects.join(", ")} (Overall: ${latestReport.percentage}%).`;

      const recipients = [enr.student.account.id];
      if (headAccount) recipients.push(headAccount.id);

      for (const recId of recipients) {
        await db.notification.upsert({
          where: {
            recipientId_dedupeKey: {
              recipientId: recId,
              dedupeKey,
            },
          },
          create: {
            recipientId: recId,
            kind: "ACADEMIC_EXAM",
            severity: "URGENT",
            title,
            body,
            dedupeKey,
            state: "OPEN",
          },
          update: {
            title,
            body,
            state: "OPEN",
          },
        });
      }
    }
  }
}

// ───────────────────────── Daily Fee Dues Alert Processing ─────────────────────────

export async function processDailyFeeAlerts(db: Db) {
  const today = new Date();

  // Find all active students with overdue fee charges
  const activeStudents = await db.student.findMany({
    where: { status: "ACTIVE" },
    include: {
      account: true,
      feeAccount: {
        include: {
          charges: {
            where: {
              status: "ACTIVE",
              dueDate: { lte: today },
            },
          },
        },
      },
    },
  });

  let processedCount = 0;

  for (const stu of activeStudents) {
    if (!stu.feeAccount || !stu.account) continue;

    const ledger = await calculateAccountLedger(db, stu.feeAccount.id);
    const dedupeKey = `FEE-DUE-${stu.id}`;

    if (ledger.outstandingBalance.greaterThan(ZERO)) {
      // Outstanding balance exists
      const title = "Fee Payment Overdue";
      const body = `Outstanding school fee balance of ₹${ledger.outstandingBalance} is due for payment.`;

      await db.notification.upsert({
        where: {
          recipientId_dedupeKey: {
            recipientId: stu.account.id,
            dedupeKey,
          },
        },
        create: {
          recipientId: stu.account.id,
          kind: "FEE_DUE",
          severity: "WARNING",
          title,
          body,
          dedupeKey,
          state: "OPEN",
        },
        update: {
          title,
          body,
          state: "OPEN",
          updatedAt: new Date(),
        },
      });
      processedCount++;
    } else {
      // Settlement resolves existing fee alert
      await db.notification.updateMany({
        where: {
          recipientId: stu.account.id,
          dedupeKey,
          state: "OPEN",
        },
        data: {
          state: "RESOLVED",
          resolvedAt: new Date(),
        },
      });
    }
  }

  return { processedCount };
}

// ───────────────────────── Stakeholder Financial & Academic Reporting ─────────────────────────

export interface FinancialReportFilter {
  academicYearId?: string;
  from?: Date;
  to?: Date;
}

export async function getStakeholderFinancialSummary(db: Db, filter: FinancialReportFilter) {
  const whereDate = (field: string) => {
    const q: any = {};
    if (filter.from) q.gte = filter.from;
    if (filter.to) q.lte = filter.to;
    return Object.keys(q).length ? { [field]: q } : {};
  };

  const payments = await db.payment.findMany({
    where: {
      status: "POSTED",
      ...whereDate("receivedOn"),
    },
  });

  const refunds = await db.refund.findMany({
    where: {
      status: "POSTED",
      ...whereDate("refundedOn"),
    },
  });

  const concessions = await db.concession.findMany({
    where: {
      status: "APPROVED",
      ...whereDate("decidedAt"),
    },
  });

  const expenses = await db.expense.findMany({
    where: {
      status: "POSTED",
      ...whereDate("spentOn"),
    },
    include: { category: true },
  });

  const payrolls = await db.payrollRecord.findMany({
    where: {
      status: "PAID",
      ...whereDate("paidOn"),
    },
  });

  const totalRevenue = sum(payments.map((p) => p.amount));
  const totalRefunded = sum(refunds.map((r) => r.amount));
  const netRevenue = totalRevenue.minus(totalRefunded);
  const totalConcessions = sum(concessions.map((c) => c.amount || 0));
  const totalExpenses = sum(expenses.map((e) => e.amount));
  const totalPayroll = sum(payrolls.map((p) => p.net));
  const totalOutflows = totalExpenses.plus(totalPayroll);
  const netOperatingIncome = netRevenue.minus(totalOutflows);

  return {
    totalRevenue: round2(totalRevenue),
    totalRefunded: round2(totalRefunded),
    netRevenue: round2(netRevenue),
    totalConcessions: round2(totalConcessions),
    totalExpenses: round2(totalExpenses),
    totalPayroll: round2(totalPayroll),
    totalOutflows: round2(totalOutflows),
    netOperatingIncome: round2(netOperatingIncome),
  };
}

export async function getAdmissionsConversionReport(db: Db, academicYearId?: string) {
  const enquiries = await db.enquiry.findMany({
    where: academicYearId ? { academicYearId } : {},
    include: { application: true },
  });

  const totalEnquiries = enquiries.length;
  const applications = enquiries.filter((e) => e.application !== null);
  const enrolled = enquiries.filter((e) => e.application?.status === "ENROLLED");
  const lost = enquiries.filter((e) => e.status === "LOST");

  const conversionRate = totalEnquiries > 0
    ? percentage(enrolled.length, totalEnquiries)
    : ZERO;

  const lostByReason: Record<string, number> = {};
  for (const l of lost) {
    const r = l.lostReason || "OTHER";
    lostByReason[r] = (lostByReason[r] || 0) + 1;
  }

  const lostBySource: Record<string, number> = {};
  for (const l of lost) {
    lostBySource[l.source] = (lostBySource[l.source] || 0) + 1;
  }

  return {
    totalEnquiries,
    totalApplications: applications.length,
    totalEnrolled: enrolled.length,
    conversionRate,
    lostCount: lost.length,
    lostByReason,
    lostBySource,
  };
}

// ───────────────────────── Best Students Ranking ─────────────────────────

export async function getTopStudentsRanking(db: Db, classId: string) {
  // Find the latest published class-wide examination for this class
  const exam = await db.exam.findFirst({
    where: {
      classId,
      scope: "CLASS_WIDE",
      status: "PUBLISHED",
    },
    orderBy: { publishedAt: "desc" },
  });
  if (!exam) return { exam: null, rankings: [] };

  const reportCards = await db.reportCard.findMany({
    where: {
      examId: exam.id,
      isCurrent: true,
      isComplete: true, // incomplete results are excluded
    },
    include: {
      enrollment: {
        include: {
          student: true,
          section: true,
        },
      },
    },
  });

  // Sort descending by percentage, then total marks
  const sorted = [...reportCards].sort((a, b) => {
    const diff = D(b.percentage).minus(D(a.percentage));
    if (!diff.isZero()) return diff.isNegative() ? -1 : 1;
    return D(b.totalMarks).minus(D(a.totalMarks)).isNegative() ? -1 : 1;
  });

  // Assign ranks with ties sharing the same rank
  let currentRank = 1;
  const rankings = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    if (i > 0) {
      const prev = sorted[i - 1];
      if (D(current.percentage).equals(D(prev.percentage))) {
        // Tied with previous: share rank
      } else {
        currentRank = i + 1;
      }
    }
    rankings.push({
      rank: currentRank,
      studentId: current.enrollment.studentId,
      studentName: `${current.enrollment.student.firstName} ${current.enrollment.student.lastName}`,
      admissionNumber: current.enrollment.student.admissionNumber,
      sectionName: current.enrollment.section.name,
      percentage: current.percentage,
      totalMarks: current.totalMarks,
      maxMarks: current.maxMarks,
      passed: current.passed,
    });
  }

  return {
    exam: {
      id: exam.id,
      name: exam.name,
      category: exam.category,
      publishedAt: exam.publishedAt,
    },
    rankings,
  };
}
