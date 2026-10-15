import { prisma, transact, type Db, type Tx } from "@/lib/db";
import { audit } from "@/lib/audit";
import { badRequest, conflict, notFound, unprocessable } from "@/lib/errors";
import { D, round2, sum, percentage, ZERO, type Dec } from "@/lib/money";
import {
  AttendanceStatus,
  CourseworkKind,
  CourseworkStatus,
  ExamCategory,
  ExamScope,
  ExamStatus,
  MarkStatus,
  PromotionDecisionType,
  PromotionStatus,
  SubmissionStatus,
} from "@prisma/client";

// ───────────────────────── Daily Attendance ─────────────────────────

export interface RecordAttendanceInput {
  sectionId: string;
  date: Date;
  records: {
    enrollmentId: string;
    status: AttendanceStatus;
    remarks?: string | null;
  }[];
}

export async function recordSectionAttendance(
  db: Db,
  input: RecordAttendanceInput,
  actorId: string,
) {
  return await transact(async (tx) => {
    const section = await tx.section.findUnique({
      where: { id: input.sectionId },
      include: {
        enrollments: { where: { status: "ACTIVE" } },
      },
    });
    if (!section) throw notFound("Section");

    const existingSheet = await tx.attendanceSheet.findUnique({
      where: {
        sectionId_date: {
          sectionId: input.sectionId,
          date: input.date,
        },
      },
    });
    if (existingSheet) {
      throw conflict("Attendance has already been recorded for this section on this date. Use correction.");
    }

    const sheet = await tx.attendanceSheet.create({
      data: {
        sectionId: input.sectionId,
        date: input.date,
        submittedBy: actorId,
        records: {
          create: input.records.map((r) => ({
            enrollmentId: r.enrollmentId,
            date: input.date,
            status: r.status,
            remarks: r.remarks?.trim() || null,
          })),
        },
      },
      include: { records: true },
    });

    await audit(tx, {
      actorId,
      action: "ATTENDANCE_RECORDED",
      entityType: "AttendanceSheet",
      entityId: sheet.id,
      summary: `Recorded attendance for section ${section.name} on ${input.date.toISOString().slice(0, 10)} (${sheet.records.length} students)`,
    });

    return sheet;
  });
}

export async function correctAttendanceRecord(
  db: Db,
  recordId: string,
  newStatus: AttendanceStatus,
  reason: string,
  actorId: string,
) {
  if (!reason.trim()) throw badRequest("Correction reason is required");

  return await transact(async (tx) => {
    const record = await tx.attendanceRecord.findUnique({ where: { id: recordId } });
    if (!record) throw notFound("Attendance record");
    if (record.status === newStatus) return record;

    const oldStatus = record.status;

    await tx.attendanceCorrection.create({
      data: {
        recordId,
        oldStatus,
        newStatus,
        reason: reason.trim(),
        correctedBy: actorId,
      },
    });

    const updated = await tx.attendanceRecord.update({
      where: { id: recordId },
      data: { status: newStatus },
    });

    await audit(tx, {
      actorId,
      action: "ATTENDANCE_CORRECTED",
      entityType: "AttendanceRecord",
      entityId: recordId,
      summary: `Corrected attendance status from ${oldStatus} to ${newStatus}. Reason: ${reason}`,
    });

    return updated;
  });
}

// ───────────────────────── Coursework & Physical Submissions ─────────────────────────

export interface CreateCourseworkInput {
  offeringId: string;
  kind: CourseworkKind;
  title: string;
  instructions: string;
  assignedOn: Date;
  dueDate: Date;
  maxMarks?: Dec | null;
}

export async function createCoursework(
  db: Db,
  input: CreateCourseworkInput,
  actorId: string,
) {
  if (input.dueDate < input.assignedOn) {
    throw badRequest("Due date cannot be before assigned date");
  }

  return await transact(async (tx) => {
    const offering = await tx.sectionSubject.findUnique({ where: { id: input.offeringId } });
    if (!offering) throw notFound("Subject offering");

    const coursework = await tx.coursework.create({
      data: {
        offeringId: input.offeringId,
        kind: input.kind,
        title: input.title.trim(),
        instructions: input.instructions.trim(),
        assignedOn: input.assignedOn,
        dueDate: input.dueDate,
        maxMarks: input.maxMarks ? round2(input.maxMarks) : null,
        status: "PUBLISHED",
        publishedAt: new Date(),
        createdBy: actorId,
      },
    });

    await audit(tx, {
      actorId,
      action: "COURSEWORK_PUBLISHED",
      entityType: "Coursework",
      entityId: coursework.id,
      summary: `Published ${input.kind}: ${coursework.title}`,
    });

    return coursework;
  });
}

export interface RecordSubmissionInput {
  courseworkId: string;
  enrollmentId: string;
  status: SubmissionStatus;
  marks?: Dec | null;
  feedback?: string | null;
}

export async function recordPhysicalSubmission(
  db: Db,
  input: RecordSubmissionInput,
  actorId: string,
) {
  return await transact(async (tx) => {
    const cw = await tx.coursework.findUnique({ where: { id: input.courseworkId } });
    if (!cw) throw notFound("Coursework");

    if (input.marks && cw.maxMarks && D(input.marks).greaterThan(D(cw.maxMarks))) {
      throw badRequest(`Marks cannot exceed maximum marks (${cw.maxMarks})`);
    }

    const submission = await tx.courseworkSubmission.upsert({
      where: {
        courseworkId_enrollmentId: {
          courseworkId: input.courseworkId,
          enrollmentId: input.enrollmentId,
        },
      },
      create: {
        courseworkId: input.courseworkId,
        enrollmentId: input.enrollmentId,
        status: input.status,
        marks: input.marks ? round2(input.marks) : null,
        feedback: input.feedback?.trim() || null,
        recordedBy: actorId,
      },
      update: {
        status: input.status,
        marks: input.marks ? round2(input.marks) : null,
        feedback: input.feedback?.trim() || null,
        recordedBy: actorId,
      },
    });

    return submission;
  });
}

// ───────────────────────── Examinations & Report Cards ─────────────────────────

export interface CreateExamInput {
  academicYearId: string;
  classId: string;
  scope: ExamScope;
  category?: ExamCategory;
  name: string;
  sectionId?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  papers: {
    classSubjectId: string;
    maxMarks: Dec;
    passMarks: Dec;
    examDate?: Date | null;
  }[];
}

export async function createExam(db: Db, input: CreateExamInput, actorId: string) {
  return await transact(async (tx) => {
    const cls = await tx.schoolClass.findUnique({ where: { id: input.classId } });
    if (!cls) throw notFound("Class");

    if (input.scope === "SUBJECT_TEST" && !input.sectionId) {
      throw badRequest("Subject test must be scoped to a specific section");
    }
    if (input.scope === "CLASS_WIDE" && input.sectionId) {
      throw badRequest("Class-wide examination cannot be scoped to a single section");
    }

    for (const p of input.papers) {
      if (D(p.passMarks).greaterThan(D(p.maxMarks))) {
        throw badRequest("Pass marks cannot exceed maximum marks");
      }
    }

    const exam = await tx.exam.create({
      data: {
        academicYearId: input.academicYearId,
        classId: input.classId,
        scope: input.scope,
        category: input.category || "OTHER",
        name: input.name.trim(),
        sectionId: input.sectionId || null,
        startDate: input.startDate || null,
        endDate: input.endDate || null,
        status: "MARKS_OPEN",
        createdBy: actorId,
        papers: {
          create: input.papers.map((p) => ({
            classSubjectId: p.classSubjectId,
            maxMarks: round2(p.maxMarks),
            passMarks: round2(p.passMarks),
            examDate: p.examDate || null,
          })),
        },
      },
      include: { papers: true },
    });

    await audit(tx, {
      actorId,
      action: "EXAM_CREATED",
      entityType: "Exam",
      entityId: exam.id,
      summary: `Created exam "${exam.name}" (${exam.scope}) with ${exam.papers.length} papers`,
    });

    return exam;
  });
}

export interface EnterMarkInput {
  paperId: string;
  enrollmentId: string;
  status: MarkStatus;
  marks?: Dec | null;
}

export async function enterStudentMark(db: Db, input: EnterMarkInput, actorId: string) {
  return await transact(async (tx) => {
    const paper = await tx.examPaper.findUnique({
      where: { id: input.paperId },
      include: { exam: true },
    });
    if (!paper) throw notFound("Exam paper");
    if (paper.exam.status === "PUBLISHED") {
      throw unprocessable("Marks cannot be modified while exam is published. Reopen the exam first.");
    }

    if (input.status === "ENTERED") {
      if (!input.marks || D(input.marks).isNegative()) {
        throw badRequest("Marks value is required when status is ENTERED");
      }
      if (D(input.marks).greaterThan(D(paper.maxMarks))) {
        throw badRequest(`Marks cannot exceed paper maximum marks (${paper.maxMarks})`);
      }
    } else {
      if (input.marks !== undefined && input.marks !== null) {
        throw badRequest("Marks must be null when student is ABSENT or EXEMPT");
      }
    }

    const mark = await tx.examMark.upsert({
      where: {
        paperId_enrollmentId: {
          paperId: input.paperId,
          enrollmentId: input.enrollmentId,
        },
      },
      create: {
        paperId: input.paperId,
        enrollmentId: input.enrollmentId,
        status: input.status,
        marks: input.marks ? round2(input.marks) : null,
        enteredBy: actorId,
      },
      update: {
        status: input.status,
        marks: input.marks ? round2(input.marks) : null,
        enteredBy: actorId,
      },
    });

    return mark;
  });
}

// ───────────────────────── Official Results Publication ─────────────────────────

export async function publishExamResults(db: Db, examId: string, actorId: string) {
  return await transact(async (tx) => {
    const exam = await tx.exam.findUnique({
      where: { id: examId },
      include: {
        papers: {
          include: {
            classSubject: { include: { subject: true } },
            marks: true,
          },
        },
        class: {
          include: {
            enrollments: {
              where: { status: "ACTIVE" },
              include: {
                subjects: true,
              },
            },
          },
        },
      },
    });
    if (!exam) throw notFound("Exam");
    if (exam.status === "PUBLISHED") throw conflict("Exam results are already published");

    const activeEnrollments = exam.scope === "SUBJECT_TEST" && exam.sectionId
      ? exam.class.enrollments.filter((e) => e.sectionId === exam.sectionId)
      : exam.class.enrollments;

    // Check completeness: Every active student enrolled in the paper's subject MUST have an entry (ENTERED, ABSENT, or EXEMPT). Missing entry prevents publication!
    for (const paper of exam.papers) {
      const eligibleEnrollments = activeEnrollments.filter((enr) =>
        enr.subjects.some((s) => s.classSubjectId === paper.classSubjectId),
      );

      for (const enr of eligibleEnrollments) {
        const mark = paper.marks.find((m) => m.enrollmentId === enr.id);
        if (!mark) {
          throw unprocessable(
            `Missing marks entry for paper "${paper.classSubject.subject.name}" for enrollment ${enr.id}. Missing entries prevent publication.`,
          );
        }
      }
    }

    // New publication version
    const newVersion = exam.currentVersion + 1;

    // Mark previous report cards non-current
    await tx.reportCard.updateMany({
      where: { examId, isCurrent: true },
      data: { isCurrent: false },
    });

    // Generate consolidated ReportCards for all eligible students
    for (const enr of activeEnrollments) {
      const studentPapers = exam.papers.filter((p) =>
        enr.subjects.some((s) => s.classSubjectId === p.classSubjectId),
      );

      if (studentPapers.length === 0) continue;

      let earnedMarks = ZERO;
      let possibleMarks = ZERO;
      let allPassed = true;
      const lines = [];

      for (const p of studentPapers) {
        const mark = p.marks.find((m) => m.enrollmentId === enr.id)!;
        const passMarks = D(p.passMarks);
        const maxMarks = D(p.maxMarks);

        let lineEarned: Dec | null = null;
        let linePassed = false;

        if (mark.status === "ENTERED") {
          lineEarned = D(mark.marks);
          linePassed = lineEarned.greaterThanOrEqualTo(passMarks);
          earnedMarks = earnedMarks.plus(lineEarned);
          possibleMarks = possibleMarks.plus(maxMarks);
        } else if (mark.status === "ABSENT") {
          // Absent explicitly contributes 0
          lineEarned = ZERO;
          linePassed = false;
          possibleMarks = possibleMarks.plus(maxMarks);
        } else if (mark.status === "EXEMPT") {
          // Exempt is excluded from calculations
          lineEarned = null;
          linePassed = true;
        }

        if (!linePassed) allPassed = false;

        lines.push({
          classSubjectId: p.classSubjectId,
          subjectName: p.classSubject.subject.name,
          status: mark.status,
          marks: lineEarned ? round2(lineEarned) : null,
          maxMarks: round2(maxMarks),
          passMarks: round2(passMarks),
          passed: linePassed,
        });
      }

      const overallPercentage = percentage(earnedMarks, possibleMarks);

      await tx.reportCard.create({
        data: {
          examId,
          enrollmentId: enr.id,
          version: newVersion,
          isCurrent: true,
          totalMarks: round2(earnedMarks),
          maxMarks: round2(possibleMarks),
          percentage: overallPercentage,
          passed: allPassed,
          isComplete: true,
          publishedBy: actorId,
          lines: {
            create: lines,
          },
        },
      });
    }

    const updatedExam = await tx.exam.update({
      where: { id: examId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        publishedBy: actorId,
        currentVersion: newVersion,
      },
    });

    await tx.examPublicationLog.create({
      data: {
        examId,
        action: "PUBLISH",
        version: newVersion,
        actorId,
      },
    });

    await audit(tx, {
      actorId,
      action: "EXAM_PUBLISHED",
      entityType: "Exam",
      entityId: examId,
      summary: `Published official results for exam "${exam.name}" (version ${newVersion})`,
    });

    return updatedExam;
  });
}

export async function reopenExam(db: Db, examId: string, reason: string, actorId: string) {
  if (!reason.trim()) throw badRequest("Reopen reason is required");

  return await transact(async (tx) => {
    const exam = await tx.exam.findUnique({ where: { id: examId } });
    if (!exam) throw notFound("Exam");
    if (exam.status !== "PUBLISHED") throw badRequest("Only published exams can be reopened");

    const updated = await tx.exam.update({
      where: { id: examId },
      data: { status: "REOPENED" },
    });

    await tx.examPublicationLog.create({
      data: {
        examId,
        action: "REOPEN",
        version: exam.currentVersion,
        reason: reason.trim(),
        actorId,
      },
    });

    await audit(tx, {
      actorId,
      action: "EXAM_REOPENED",
      entityType: "Exam",
      entityId: examId,
      summary: `Reopened exam "${exam.name}". Reason: ${reason}`,
    });

    return updated;
  });
}

// ───────────────────────── Promotions & Retention ─────────────────────────

export interface SubmitPromotionInput {
  enrollmentId: string;
  decision: PromotionDecisionType;
  toClassId?: string | null;
  toSectionId?: string | null;
  remarks?: string | null;
}

export async function preparePromotionDecision(
  db: Db,
  input: SubmitPromotionInput,
  actorId: string,
) {
  return await transact(async (tx) => {
    const enr = await tx.enrollment.findUnique({ where: { id: input.enrollmentId } });
    if (!enr) throw notFound("Enrollment");

    const decision = await tx.promotionDecision.upsert({
      where: { enrollmentId: input.enrollmentId },
      create: {
        enrollmentId: input.enrollmentId,
        decision: input.decision,
        toClassId: input.toClassId || null,
        toSectionId: input.toSectionId || null,
        remarks: input.remarks?.trim() || null,
        status: "SUBMITTED",
        preparedBy: actorId,
        submittedAt: new Date(),
      },
      update: {
        decision: input.decision,
        toClassId: input.toClassId || null,
        toSectionId: input.toSectionId || null,
        remarks: input.remarks?.trim() || null,
        status: "SUBMITTED",
        preparedBy: actorId,
        submittedAt: new Date(),
      },
    });

    await audit(tx, {
      actorId,
      action: "PROMOTION_DECISION_SUBMITTED",
      entityType: "PromotionDecision",
      entityId: decision.id,
      summary: `Submitted promotion decision ${input.decision} for enrollment ${enr.id}`,
    });

    return decision;
  });
}

export async function confirmPromotionDecision(
  db: Db,
  decisionId: string,
  targetAcademicYearId: string,
  actorId: string,
) {
  return await transact(async (tx) => {
    const decision = await tx.promotionDecision.findUnique({
      where: { id: decisionId },
      include: {
        enrollment: {
          include: { student: true, class: true },
        },
      },
    });
    if (!decision) throw notFound("Promotion decision");
    if (decision.status !== "SUBMITTED") throw badRequest(`Decision status is ${decision.status}`);

    const enr = decision.enrollment;
    let resultingEnrollmentId: string | null = null;

    if (decision.decision === "PROMOTE" || decision.decision === "RETAIN") {
      const nextClassId = decision.decision === "PROMOTE"
        ? (decision.toClassId || enr.classId)
        : enr.classId;

      // Ensure class exists in target academic year
      const targetClass = await tx.schoolClass.findUnique({
        where: { id: nextClassId },
        include: { sections: true, classSubjects: true },
      });
      if (!targetClass) throw notFound("Target Class");

      const targetSectionId = decision.toSectionId || targetClass.sections[0]?.id;
      if (!targetSectionId) throw badRequest("Target class has no sections available");

      // Create new enrollment in next academic year
      const newEnr = await tx.enrollment.create({
        data: {
          studentId: enr.studentId,
          academicYearId: targetAcademicYearId,
          classId: targetClass.id,
          sectionId: targetSectionId,
          status: "ACTIVE",
          startedOn: new Date(),
          subjectsConfirmed: true,
          subjects: {
            create: targetClass.classSubjects
              .filter((cs) => cs.type === "CORE")
              .map((cs) => ({ classSubjectId: cs.id })),
          },
          placements: {
            create: {
              sectionId: targetSectionId,
              fromDate: new Date(),
              reason: decision.decision === "PROMOTE" ? "Promoted" : "Retained",
            },
          },
        },
      });
      resultingEnrollmentId = newEnr.id;

      // Update past enrollment status
      await tx.enrollment.update({
        where: { id: enr.id },
        data: {
          status: decision.decision === "PROMOTE" ? "PROMOTED" : "RETAINED",
          endedOn: new Date(),
        },
      });
    } else if (decision.decision === "GRADUATE") {
      await tx.enrollment.update({
        where: { id: enr.id },
        data: {
          status: "GRADUATED",
          endedOn: new Date(),
        },
      });
      await tx.student.update({
        where: { id: enr.studentId },
        data: { status: "GRADUATED" },
      });
    }

    const updated = await tx.promotionDecision.update({
      where: { id: decisionId },
      data: {
        status: "CONFIRMED",
        confirmedBy: actorId,
        confirmedAt: new Date(),
        resultingEnrollmentId,
      },
    });

    await audit(tx, {
      actorId,
      action: "PROMOTION_CONFIRMED",
      entityType: "PromotionDecision",
      entityId: decisionId,
      summary: `Confirmed ${decision.decision} for student ${enr.student.admissionNumber}`,
    });

    return updated;
  });
}
