import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { resetDatabase } from "@/lib/testing/reset";
import { createStaffAccount, assignPosition } from "@/lib/services/staff";
import { createAcademicYear, createClass, createSection, createSubject, addClassSubject } from "@/lib/services/academics";
import { recordPayment, proposeConcession, decideConcession, calculateAccountLedger } from "@/lib/services/finance";
import { createApplication, assignFeePlanToApplication, grantFinancialClearance, enrollStudent } from "@/lib/services/admissions";
import { createExam, enterStudentMark, publishExamResults } from "@/lib/services/operations";
import { getTopStudentsRanking } from "@/lib/services/reporting";
import { D } from "@/lib/money";

describe("School System Core Scenarios", () => {
  let year: any;
  let cls: any;
  let secA: any;
  let secB: any;
  let csMath: any;
  let csSci: any;

  beforeAll(async () => {
    await resetDatabase();

    year = await createAcademicYear(prisma, {
      name: "2026-2027",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2027-03-31"),
      status: "ACTIVE",
    });

    cls = await createClass(prisma, {
      academicYearId: year.id,
      name: "Class 10",
      level: 10,
      hasStreams: false,
    });

    secA = await createSection(prisma, { classId: cls.id, name: "A", capacity: 40 });
    secB = await createSection(prisma, { classId: cls.id, name: "B", capacity: 40 });

    const math = await createSubject(prisma, { code: "MATH10", name: "Mathematics" });
    const sci = await createSubject(prisma, { code: "SCI10", name: "Science" });

    csMath = await addClassSubject(prisma, { classId: cls.id, subjectId: math.id, type: "CORE" });
    csSci = await addClassSubject(prisma, { classId: cls.id, subjectId: sci.id, type: "CORE" });
  });
  it("Scenario 1: Teacher heading one section while teaching another, and role-based scoping", async () => {
    // 2. Staff: Teacher John heading Sec A and teaching Math in Sec B
    // 2. Staff: Teacher John heading Sec A and teaching Math in Sec B
    const teacher = await createStaffAccount(prisma, {
      displayName: "John Doe",
      authEmail: "john.doe@school.test",
    });

    // Assign John as Section Head of Sec A
    const headAssign = await assignPosition(prisma, {
      accountId: teacher.id,
      position: "SECTION_HEAD",
      sectionId: secA.id,
    });
    expect(headAssign.position).toBe("SECTION_HEAD");

    // Offering for Math in Sec B
    const offeringMathB = await prisma.sectionSubject.findUnique({
      where: { sectionId_classSubjectId: { sectionId: secB.id, classSubjectId: csMath.id } },
    });
    expect(offeringMathB).not.toBeNull();

    // Assign John as Subject Teacher for Math in Sec B
    const teachAssign = await assignPosition(prisma, {
      accountId: teacher.id,
      position: "SUBJECT_TEACHER",
      offeringId: offeringMathB!.id,
    });
    expect(teachAssign.position).toBe("SUBJECT_TEACHER");

    // Check conflict: Cannot have a second active Section Head on Sec A
    const teacher2 = await createStaffAccount(prisma, {
      displayName: "Jane Smith",
      authEmail: "jane.smith@school.test",
    });
    await expect(
      assignPosition(prisma, {
        accountId: teacher2.id,
        position: "SECTION_HEAD",
        sectionId: secA.id,
      }),
    ).rejects.toThrow();

    // Removing assignment allows new assignment
    await prisma.positionAssignment.update({
      where: { id: headAssign.id },
      data: { endedAt: new Date() },
    });
    const newHead = await assignPosition(prisma, {
      accountId: teacher2.id,
      position: "SECTION_HEAD",
      sectionId: secA.id,
    });
    expect(newHead.accountId).toBe(teacher2.id);
  });

  it("Scenario 2: Admission clearance, concessions, and student enrollment with credentials", async () => {
    const year = await prisma.academicYear.findFirstOrThrow({ where: { status: "ACTIVE" } });
    const cls = await prisma.schoolClass.findFirstOrThrow({ where: { academicYearId: year.id } });
    const sec = await prisma.section.findFirstOrThrow({ where: { classId: cls.id } });

    // Create Fee Head and Plan with mandatory installment
    const feeHead = await prisma.feeHead.create({
      data: { code: "TUITION", name: "Tuition Fee" },
    });
    const feePlan = await prisma.feePlan.create({
      data: {
        academicYearId: year.id,
        classId: cls.id,
        name: "Standard Annual Plan",
        items: {
          create: {
            feeHeadId: feeHead.id,
            scheduleType: "ANNUAL",
            totalAmount: 10000,
            installments: {
              create: [
                {
                  sequence: 1,
                  label: "Admission Deposit",
                  dueDate: new Date("2026-04-10"),
                  amount: 4000,
                  mandatoryForAdmission: true,
                },
                {
                  sequence: 2,
                  label: "Term 2 Fee",
                  dueDate: new Date("2026-10-10"),
                  amount: 6000,
                  mandatoryForAdmission: false,
                },
              ],
            },
          },
        },
      },
    });

    // Create Application
    const app = await createApplication(
      prisma,
      {
        academicYearId: year.id,
        classId: cls.id,
        sectionId: sec.id,
        studentFirstName: "Rohan",
        studentLastName: "Gupta",
        email: "rohan.gupta@example.test",
        phone: "9876543210",
        guardians: [
          { name: "Suresh Gupta", relation: "Father", phone: "9876543210", isPrimary: true },
        ],
      },
      "accounts-admin",
    );

    // Assign Fee Plan
    await assignFeePlanToApplication(prisma, app.id, feePlan.id, "accounts-admin");

    // Clearance should FAIL initially because ₹4,000 mandatory charge is unpaid
    await expect(grantFinancialClearance(prisma, app.id, "accounts-admin")).rejects.toThrow();

    // Accounts records a partial payment of ₹1,000
    const feeAccount = await prisma.feeAccount.findUniqueOrThrow({
      where: { applicationId: app.id },
    });
    await recordPayment(
      prisma,
      {
        feeAccountId: feeAccount.id,
        amount: D(1000),
        receivedOn: new Date("2026-04-05"),
        method: "UPI",
      },
      "accounts-admin",
    );

    // Still not cleared (1000 < 4000)
    await expect(grantFinancialClearance(prisma, app.id, "accounts-admin")).rejects.toThrow();

    // Stakeholder approves a Scholarship concession of ₹3,000 for the admission charge
    const conc = await proposeConcession(
      prisma,
      {
        feeAccountId: feeAccount.id,
        type: "SCHOLARSHIP",
        mode: "FIXED",
        value: D(3000),
        reason: "Merit scholarship",
      },
      "accounts-admin",
    );
    await decideConcession(prisma, conc.id, "APPROVED", "Approved merit", "stakeholder-id");

    // Now mandatory covered is 1000 + 3000 = 4000. Clearance should SUCCEED!
    const cleared = await grantFinancialClearance(prisma, app.id, "accounts-admin");
    expect(cleared.status).toBe("CLEARED");

    // Enroll student
    const enrolled = await enrollStudent(
      prisma,
      {
        applicationId: app.id,
        sectionId: sec.id,
        rollNumber: 1,
      },
      "admissions-staff",
    );

    expect(enrolled.student.admissionNumber).toMatch(/^ADM-/);
    expect(enrolled.tempPassword).toBeDefined();

    // Ledger check
    const ledger = await calculateAccountLedger(prisma, feeAccount.id);
    expect(ledger.totalCharges.toFixed(2)).toBe("10000.00");
    expect(ledger.totalConcessions.toFixed(2)).toBe("3000.00");
    expect(ledger.netPaid.toFixed(2)).toBe("1000.00");
    expect(ledger.outstandingBalance.toFixed(2)).toBe("6000.00");
    expect(ledger.isClearedForAdmission).toBe(true);
  });

  it("Scenario 3: Exam publication completeness check, report cards, ties ranking", async () => {
    const year = await prisma.academicYear.findFirstOrThrow({ where: { status: "ACTIVE" } });
    const cls = await prisma.schoolClass.findFirstOrThrow({ where: { academicYearId: year.id } });
    const sec = await prisma.section.findFirstOrThrow({ where: { classId: cls.id } });
    const subjects = await prisma.classSubject.findMany({ where: { classId: cls.id } });

    // Enroll a second student so we can test ranking ties
    const app2 = await createApplication(
      prisma,
      {
        academicYearId: year.id,
        classId: cls.id,
        sectionId: sec.id,
        studentFirstName: "Aarav",
        studentLastName: "Sharma",
        guardians: [{ name: "Raj Sharma", relation: "Father", phone: "9876543211" }],
      },
      "accounts-admin",
    );
    await grantFinancialClearance(prisma, app2.id, "accounts-admin");
    await enrollStudent(prisma, { applicationId: app2.id, sectionId: sec.id, rollNumber: 2 }, "admin");

    // Create a Class-wide exam
    const exam = await createExam(
      prisma,
      {
        academicYearId: year.id,
        classId: cls.id,
        scope: "CLASS_WIDE",
        name: "Half-Yearly Exam 2026",
        papers: subjects.map((s) => ({
          classSubjectId: s.id,
          maxMarks: D(100),
          passMarks: D(40),
        })),
      },
      "principal-id",
    );

    // Publication must FAIL if entries are missing!
    await expect(publishExamResults(prisma, exam.id, "incharge-id")).rejects.toThrow(/Missing marks entry/);

    const enrollments = await prisma.enrollment.findMany({ where: { classId: cls.id, status: "ACTIVE" } });

    // Enter identical marks for both students to test rank tie
    for (const paper of exam.papers) {
      for (const enr of enrollments) {
        await enterStudentMark(
          prisma,
          {
            paperId: paper.id,
            enrollmentId: enr.id,
            status: "ENTERED",
            marks: D(85),
          },
          "teacher-id",
        );
      }
    }

    // Now publication should succeed
    const published = await publishExamResults(prisma, exam.id, "incharge-id");
    expect(published.status).toBe("PUBLISHED");

    // Test ranking with ties
    const { rankings } = await getTopStudentsRanking(prisma, cls.id);
    expect(rankings.length).toBe(2);
    expect(rankings[0].rank).toBe(1);
    expect(rankings[1].rank).toBe(1); // Equal percentage must share rank 1!
    expect(rankings[0].percentage.toFixed(2)).toBe("85.00");
  });

  afterAll(async () => {
    await resetDatabase();
  });
});
