import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { PrismaClient, Position, ConcessionMode, ConcessionType, PaymentMethod } from "@prisma/client";
import { hashPassword } from "../lib/auth/passwords";
import { D } from "../lib/money";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting school portal database seed...");

  // 1. School Information
  await prisma.school.upsert({
    where: { id: "school" },
    update: {},
    create: {
      id: "school",
      name: "5 Point Engineering High School",
      shortName: "5-Point Academy",
      tagline: "Discipline, Innovation, Integrity & Academic Excellence",
      address: "Campus Rd, Knowledge Park, Electronic City",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560100",
      phone: "+91 80 2345 6789",
      email: "contact@5point-engineering.edu.in",
      website: "https://5point-engineering.edu.in",
      affiliation: "CBSE Affiliation No. 1930482",
      admissionPrefix: "ADM",
      currency: "INR",
      timezone: "Asia/Kolkata",
      workingDays: [1, 2, 3, 4, 5, 6],
      classRangeFrom: 1,
      classRangeTo: 12,
      showPublicStats: true,
      siteContent: {
        highlights: [
          "State-of-the-art Robotics and Artificial Intelligence Labs",
          "100% CBSE Board pass rate with 45+ students scoring >95%",
          "Dedicated Sports Complex with Olympic-standard facilities",
          "Holistic mentorship program with industry engineer visits",
        ],
      },
    },
  });
  console.log("✓ School institution profile configured");

  // Common password hash for test accounts: Password@123
  const defaultPassword = "Password@123";
  const defaultPasswordHash = await hashPassword(defaultPassword);

  async function ensureAccountWithAuth(params: {
    displayName: string;
    authEmail: string;
    registeredEmail?: string;
    kind: "STAFF" | "STUDENT";
    phone?: string;
    designation?: string;
    employeeCode?: string;
  }) {
    const email = params.authEmail.toLowerCase();
    let account = await prisma.account.findUnique({ where: { authEmail: email } });
    if (!account) {
      account = await prisma.account.create({
        data: {
          displayName: params.displayName,
          authEmail: email,
          registeredEmail: params.registeredEmail?.toLowerCase() || email,
          kind: params.kind,
          status: "ACTIVE",
          phone: params.phone,
          mustChangePassword: false,
          provisioning: "PROVISIONED",
          staffProfile:
            params.kind === "STAFF"
              ? {
                  create: {
                    designation: params.designation || "Faculty Member",
                    employeeCode: params.employeeCode || `EMP${Math.floor(1000 + Math.random() * 9000)}`,
                    joinedOn: new Date("2024-06-01"),
                  },
                }
              : undefined,
        },
      });
    }

    const cred = await prisma.localCredential.findUnique({ where: { authEmail: email } });
    if (!cred) {
      const authUserId = `usr_${account.id.replace(/-/g, "").slice(0, 16)}`;
      await prisma.localCredential.create({
        data: {
          authUserId,
          authEmail: email,
          passwordHash: defaultPasswordHash,
          disabled: false,
        },
      });
      await prisma.account.update({
        where: { id: account.id },
        data: { authUserId },
      });
    }

    return account;
  }

  // 2. Academic Years
  await prisma.academicYear.upsert({
    where: { name: "2025-2026" },
    update: {},
    create: {
      name: "2025-2026",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-03-31"),
      status: "CLOSED",
    },
  });

  const activeYear = await prisma.academicYear.upsert({
    where: { name: "2026-2027" },
    update: {},
    create: {
      name: "2026-2027",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2027-03-31"),
      status: "ACTIVE",
    },
  });

  await prisma.academicYear.upsert({
    where: { name: "2027-2028" },
    update: {},
    create: {
      name: "2027-2028",
      startDate: new Date("2027-04-01"),
      endDate: new Date("2028-03-31"),
      status: "PLANNED",
    },
  });
  console.log("✓ Academic years created (2025-26, 2026-27 ACTIVE, 2027-28)");

  // 3. Subjects
  const subjectsData = [
    { code: "ENG10", name: "English Language & Literature" },
    { code: "MATH10", name: "Mathematics" },
    { code: "SCI10", name: "Science (Physics, Chemistry, Biology)" },
    { code: "SST10", name: "Social Science" },
    { code: "HIN10", name: "Hindi Course A" },
    { code: "PHY11", name: "Physics" },
    { code: "CHEM11", name: "Chemistry" },
    { code: "BIO11", name: "Biology" },
    { code: "CS11", name: "Computer Science with Python" },
    { code: "ACC11", name: "Accountancy" },
    { code: "BST11", name: "Business Studies" },
    { code: "ECO11", name: "Economics" },
  ];

  const subjects: Record<string, any> = {};
  for (const s of subjectsData) {
    subjects[s.code] = await prisma.subject.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
  }
  console.log(`✓ ${subjectsData.length} Subjects configured`);

  // 4. Classes & Sections for 2026-2027
  const class10 = await prisma.schoolClass.upsert({
    where: {
      academicYearId_level: {
        academicYearId: activeYear.id,
        level: 10,
      },
    },
    update: {},
    create: {
      academicYearId: activeYear.id,
      name: "Class 10",
      level: 10,
      hasStreams: false,
    },
  });

  const sec10A = await prisma.section.upsert({
    where: { classId_name: { classId: class10.id, name: "A" } },
    update: {},
    create: { classId: class10.id, name: "A", capacity: 40 },
  });

  const sec10B = await prisma.section.upsert({
    where: { classId_name: { classId: class10.id, name: "B" } },
    update: {},
    create: { classId: class10.id, name: "B", capacity: 40 },
  });

  // Class 10 Subjects
  const c10Math = await prisma.classSubject.upsert({
    where: { classId_subjectId: { classId: class10.id, subjectId: subjects["MATH10"].id } },
    update: {},
    create: { classId: class10.id, subjectId: subjects["MATH10"].id, type: "CORE" },
  });

  const c10Sci = await prisma.classSubject.upsert({
    where: { classId_subjectId: { classId: class10.id, subjectId: subjects["SCI10"].id } },
    update: {},
    create: { classId: class10.id, subjectId: subjects["SCI10"].id, type: "CORE" },
  });

  const c10Eng = await prisma.classSubject.upsert({
    where: { classId_subjectId: { classId: class10.id, subjectId: subjects["ENG10"].id } },
    update: {},
    create: { classId: class10.id, subjectId: subjects["ENG10"].id, type: "CORE" },
  });

  const c10Sst = await prisma.classSubject.upsert({
    where: { classId_subjectId: { classId: class10.id, subjectId: subjects["SST10"].id } },
    update: {},
    create: { classId: class10.id, subjectId: subjects["SST10"].id, type: "CORE" },
  });

  // Section Subject Offerings
  const off10A_Math = await prisma.sectionSubject.upsert({
    where: { sectionId_classSubjectId: { sectionId: sec10A.id, classSubjectId: c10Math.id } },
    update: {},
    create: { sectionId: sec10A.id, classSubjectId: c10Math.id },
  });

  const off10A_Sci = await prisma.sectionSubject.upsert({
    where: { sectionId_classSubjectId: { sectionId: sec10A.id, classSubjectId: c10Sci.id } },
    update: {},
    create: { sectionId: sec10A.id, classSubjectId: c10Sci.id },
  });

  const off10B_Math = await prisma.sectionSubject.upsert({
    where: { sectionId_classSubjectId: { sectionId: sec10B.id, classSubjectId: c10Math.id } },
    update: {},
    create: { sectionId: sec10B.id, classSubjectId: c10Math.id },
  });

  const off10B_Sci = await prisma.sectionSubject.upsert({
    where: { sectionId_classSubjectId: { sectionId: sec10B.id, classSubjectId: c10Sci.id } },
    update: {},
    create: { sectionId: sec10B.id, classSubjectId: c10Sci.id },
  });

  // Class 11 with Streams
  const class11 = await prisma.schoolClass.upsert({
    where: {
      academicYearId_level: {
        academicYearId: activeYear.id,
        level: 11,
      },
    },
    update: {},
    create: {
      academicYearId: activeYear.id,
      name: "Class 11",
      level: 11,
      hasStreams: true,
    },
  });

  const streamSci = await prisma.stream.upsert({
    where: { code: "SCI" },
    update: {},
    create: { name: "Science", code: "SCI" },
  });

  const streamComm = await prisma.stream.upsert({
    where: { code: "COMM" },
    update: {},
    create: { name: "Commerce", code: "COMM" },
  });

  await prisma.section.upsert({
    where: { classId_name: { classId: class11.id, name: "A (Science)" } },
    update: {},
    create: { classId: class11.id, name: "A (Science)", capacity: 35 },
  });

  await prisma.section.upsert({
    where: { classId_name: { classId: class11.id, name: "B (Commerce)" } },
    update: {},
    create: { classId: class11.id, name: "B (Commerce)", capacity: 35 },
  });
  console.log("✓ Classes & Sections created (Class 10 & Class 11 with streams)");

  // 5. Staff Accounts & Positions
  // 5.1 Stakeholder
  const stakeholder = await ensureAccountWithAuth({
    displayName: "Rajesh Singhania",
    authEmail: "stakeholder@school.edu",
    kind: "STAFF",
    designation: "Managing Trustee & Stakeholder",
    employeeCode: "STK001",
    phone: "+91 98450 11001",
  });
  await prisma.positionAssignment.upsert({
    where: { id: "pos-stakeholder" },
    update: {},
    create: {
      id: "pos-stakeholder",
      accountId: stakeholder.id,
      position: "STAKEHOLDER",
    },
  });

  // 5.2 Principal
  const principal = await ensureAccountWithAuth({
    displayName: "Dr. Meenakshi Sundaram",
    authEmail: "principal@school.edu",
    kind: "STAFF",
    designation: "Principal",
    employeeCode: "PRN001",
    phone: "+91 98450 11002",
  });
  await prisma.positionAssignment.upsert({
    where: { id: "pos-principal" },
    update: {},
    create: {
      id: "pos-principal",
      accountId: principal.id,
      position: "PRINCIPAL",
    },
  });

  // 5.3 Teacher Incharge for Class 10
  const incharge10 = await ensureAccountWithAuth({
    displayName: "Sunita Sharma",
    authEmail: "incharge10@school.edu",
    kind: "STAFF",
    designation: "Senior PGT & Academic Coordinator",
    employeeCode: "TCH001",
    phone: "+91 98450 11003",
  });
  await prisma.positionAssignment.upsert({
    where: { id: "pos-incharge-10" },
    update: {},
    create: {
      id: "pos-incharge-10",
      accountId: incharge10.id,
      position: "TEACHER_INCHARGE",
      classId: class10.id,
    },
  });

  // 5.4 Dual-responsibility Teacher: John Doe
  const teacherJohn = await ensureAccountWithAuth({
    displayName: "John Doe",
    authEmail: "teacher.john@school.edu",
    kind: "STAFF",
    designation: "TGT Mathematics",
    employeeCode: "TCH002",
    phone: "+91 98450 11004",
  });
  await prisma.positionAssignment.upsert({
    where: { id: "pos-head-10a" },
    update: {},
    create: {
      id: "pos-head-10a",
      accountId: teacherJohn.id,
      position: "SECTION_HEAD",
      sectionId: sec10A.id,
    },
  });
  await prisma.positionAssignment.upsert({
    where: { id: "pos-subj-10b-math" },
    update: {},
    create: {
      id: "pos-subj-10b-math",
      accountId: teacherJohn.id,
      position: "SUBJECT_TEACHER",
      offeringId: off10B_Math.id,
    },
  });

  // 5.5 Subject Teacher: Priya Nair
  const teacherPriya = await ensureAccountWithAuth({
    displayName: "Priya Nair",
    authEmail: "teacher.priya@school.edu",
    kind: "STAFF",
    designation: "TGT Science",
    employeeCode: "TCH003",
    phone: "+91 98450 11005",
  });
  await prisma.positionAssignment.upsert({
    where: { id: "pos-subj-10a-sci" },
    update: {},
    create: {
      id: "pos-subj-10a-sci",
      accountId: teacherPriya.id,
      position: "SUBJECT_TEACHER",
      offeringId: off10A_Sci.id,
    },
  });
  await prisma.positionAssignment.upsert({
    where: { id: "pos-subj-10b-sci" },
    update: {},
    create: {
      id: "pos-subj-10b-sci",
      accountId: teacherPriya.id,
      position: "SUBJECT_TEACHER",
      offeringId: off10B_Sci.id,
    },
  });

  // 5.6 Accounts Officer
  const accountsOfficer = await ensureAccountWithAuth({
    displayName: "Suresh Menon",
    authEmail: "accounts@school.edu",
    kind: "STAFF",
    designation: "Chief Accounts Officer",
    employeeCode: "ACT001",
    phone: "+91 98450 11006",
  });
  await prisma.positionAssignment.upsert({
    where: { id: "pos-accounts" },
    update: {},
    create: {
      id: "pos-accounts",
      accountId: accountsOfficer.id,
      position: "ACCOUNTS",
    },
  });

  // 5.7 Admissions Officer
  const admissionsOfficer = await ensureAccountWithAuth({
    displayName: "Anita Verma",
    authEmail: "admissions@school.edu",
    kind: "STAFF",
    designation: "Admissions Coordinator",
    employeeCode: "ADM001",
    phone: "+91 98450 11007",
  });
  await prisma.positionAssignment.upsert({
    where: { id: "pos-admissions" },
    update: {},
    create: {
      id: "pos-admissions",
      accountId: admissionsOfficer.id,
      position: "ADMISSIONS",
    },
  });
  console.log("✓ Staff members and position assignments configured");

  // 6. Fee Heads & Fee Plans
  const headTuition = await prisma.feeHead.upsert({
    where: { code: "TUITION" },
    update: {},
    create: { code: "TUITION", name: "Tuition Fee", description: "Regular academic instruction and lab usage" },
  });

  const headAdmission = await prisma.feeHead.upsert({
    where: { code: "ADMISSION" },
    update: {},
    create: { code: "ADMISSION", name: "Admission Fee", description: "One-time registration and matriculation charge" },
  });

  const feePlan10 = await prisma.feePlan.upsert({
    where: { id: "fp-class10-2026" },
    update: {},
    create: {
      id: "fp-class10-2026",
      academicYearId: activeYear.id,
      classId: class10.id,
      name: "Class 10 Regular Fee Plan 2026-27",
      items: {
        create: [
          {
            feeHeadId: headTuition.id,
            scheduleType: "TERM",
            totalAmount: D(65000),
            installments: {
              create: [
                {
                  label: "Term 1 (At Admission)",
                  sequence: 1,
                  amount: D(25000),
                  dueDate: new Date("2026-04-10"),
                  mandatoryForAdmission: true,
                },
                {
                  label: "Term 2 (Mid-Year)",
                  sequence: 2,
                  amount: D(20000),
                  dueDate: new Date("2026-09-15"),
                  mandatoryForAdmission: false,
                },
                {
                  label: "Term 3 (Final Term)",
                  sequence: 3,
                  amount: D(20000),
                  dueDate: new Date("2026-12-15"),
                  mandatoryForAdmission: false,
                },
              ],
            },
          },
        ],
      },
    },
  });
  console.log("✓ Fee heads and Class 10 fee plan configured");

  // 7. Enrolled Students
  // Student 1: Aarav Sharma (Class 10-A)
  const studentAaravAcc = await ensureAccountWithAuth({
    displayName: "Aarav Sharma",
    authEmail: "student.aarav@school.edu",
    registeredEmail: "aarav.parent@gmail.com",
    kind: "STUDENT",
    phone: "+91 98450 20001",
  });

  const studentAarav = await prisma.student.upsert({
    where: { accountId: studentAaravAcc.id },
    update: {},
    create: {
      accountId: studentAaravAcc.id,
      admissionNumber: "ADM2026001",
      firstName: "Aarav",
      lastName: "Sharma",
      gender: "MALE",
      dateOfBirth: new Date("2011-05-14"),
      status: "ACTIVE",
      guardians: {
        create: {
          name: "Sanjay Sharma",
          relation: "Father",
          phone: "+91 98450 20001",
          email: "aarav.parent@gmail.com",
          isPrimary: true,
        },
      },
    },
  });

  const enrollmentAarav = await prisma.enrollment.upsert({
    where: { studentId_academicYearId: { studentId: studentAarav.id, academicYearId: activeYear.id } },
    update: {},
    create: {
      studentId: studentAarav.id,
      academicYearId: activeYear.id,
      classId: class10.id,
      sectionId: sec10A.id,
      rollNumber: 1,
      status: "ACTIVE",
      startedOn: new Date("2026-04-01"),
      subjectsConfirmed: true,
      subjects: {
        create: [
          { classSubjectId: c10Math.id },
          { classSubjectId: c10Sci.id },
          { classSubjectId: c10Eng.id },
          { classSubjectId: c10Sst.id },
        ],
      },
    },
  });

  // Aarav Fee Account & Charges
  const aaravFeeAccount = await prisma.feeAccount.upsert({
    where: { studentId: studentAarav.id },
    update: {},
    create: { studentId: studentAarav.id },
  });

  const term1Aarav = await prisma.feeCharge.upsert({
    where: { id: "chg-aarav-t1" },
    update: {},
    create: {
      id: "chg-aarav-t1",
      feeAccountId: aaravFeeAccount.id,
      academicYearId: activeYear.id,
      feeHeadId: headTuition.id,
      label: "Term 1 (At Admission)",
      amount: D(25000),
      dueDate: new Date("2026-04-10"),
      mandatoryForAdmission: true,
      status: "ACTIVE",
    },
  });

  await prisma.feeCharge.upsert({
    where: { id: "chg-aarav-t2" },
    update: {},
    create: {
      id: "chg-aarav-t2",
      feeAccountId: aaravFeeAccount.id,
      academicYearId: activeYear.id,
      feeHeadId: headTuition.id,
      label: "Term 2 (Mid-Year)",
      amount: D(20000),
      dueDate: new Date("2026-09-15"),
      mandatoryForAdmission: false,
      status: "ACTIVE",
    },
  });

  // Concession for Aarav: 20% Academic Merit Scholarship
  await prisma.concession.upsert({
    where: { id: "conc-aarav-merit" },
    update: {},
    create: {
      id: "conc-aarav-merit",
      feeAccountId: aaravFeeAccount.id,
      type: "SCHOLARSHIP",
      mode: "PERCENT",
      value: D(20),
      amount: D(5000),
      reason: "Class 9 State Olympiad Gold Medalist",
      status: "APPROVED",
      proposedBy: accountsOfficer.id,
      decidedAt: new Date("2026-04-02"),
      decidedBy: stakeholder.id,
      allocations: {
        create: {
          chargeId: term1Aarav.id,
          amount: D(5000),
        },
      },
    },
  });

  // Payment for Aarav
  await prisma.payment.upsert({
    where: { receiptNumber: "REC-2026-0001" },
    update: {},
    create: {
      receiptNumber: "REC-2026-0001",
      feeAccountId: aaravFeeAccount.id,
      amount: D(20000),
      receivedOn: new Date("2026-04-05"),
      method: "UPI",
      reference: "UPI/38491823901/SBI",
      recordedBy: accountsOfficer.id,
      status: "POSTED",
      allocations: {
        create: {
          chargeId: term1Aarav.id,
          amount: D(20000),
        },
      },
    },
  });

  // Student 2: Diya Patel (Class 10-A)
  const studentDiyaAcc = await ensureAccountWithAuth({
    displayName: "Diya Patel",
    authEmail: "student.diya@school.edu",
    registeredEmail: "diya.parent@yahoo.com",
    kind: "STUDENT",
    phone: "+91 98450 20002",
  });

  const studentDiya = await prisma.student.upsert({
    where: { accountId: studentDiyaAcc.id },
    update: {},
    create: {
      accountId: studentDiyaAcc.id,
      admissionNumber: "ADM2026002",
      firstName: "Diya",
      lastName: "Patel",
      gender: "FEMALE",
      dateOfBirth: new Date("2011-08-22"),
      status: "ACTIVE",
      guardians: {
        create: {
          name: "Bhavin Patel",
          relation: "Father",
          phone: "+91 98450 20002",
          email: "diya.parent@yahoo.com",
          isPrimary: true,
        },
      },
    },
  });

  const enrollmentDiya = await prisma.enrollment.upsert({
    where: { studentId_academicYearId: { studentId: studentDiya.id, academicYearId: activeYear.id } },
    update: {},
    create: {
      studentId: studentDiya.id,
      academicYearId: activeYear.id,
      classId: class10.id,
      sectionId: sec10A.id,
      rollNumber: 2,
      status: "ACTIVE",
      startedOn: new Date("2026-04-01"),
      subjectsConfirmed: true,
      subjects: {
        create: [
          { classSubjectId: c10Math.id },
          { classSubjectId: c10Sci.id },
          { classSubjectId: c10Eng.id },
          { classSubjectId: c10Sst.id },
        ],
      },
    },
  });

  const diyaFeeAccount = await prisma.feeAccount.upsert({
    where: { studentId: studentDiya.id },
    update: {},
    create: { studentId: studentDiya.id },
  });

  const term1Diya = await prisma.feeCharge.upsert({
    where: { id: "chg-diya-t1" },
    update: {},
    create: {
      id: "chg-diya-t1",
      feeAccountId: diyaFeeAccount.id,
      academicYearId: activeYear.id,
      feeHeadId: headTuition.id,
      label: "Term 1 (At Admission)",
      amount: D(25000),
      dueDate: new Date("2026-04-10"),
      mandatoryForAdmission: true,
      status: "ACTIVE",
    },
  });

  await prisma.payment.upsert({
    where: { receiptNumber: "REC-2026-0002" },
    update: {},
    create: {
      receiptNumber: "REC-2026-0002",
      feeAccountId: diyaFeeAccount.id,
      amount: D(25000),
      receivedOn: new Date("2026-04-06"),
      method: "BANK_TRANSFER",
      reference: "NEFT/HDFC/93810293",
      recordedBy: accountsOfficer.id,
      status: "POSTED",
      allocations: {
        create: {
          chargeId: term1Diya.id,
          amount: D(25000),
        },
      },
    },
  });

  // Student 3: Rohan Gupta (Class 10-B)
  const studentRohanAcc = await ensureAccountWithAuth({
    displayName: "Rohan Gupta",
    authEmail: "student.rohan@school.edu",
    registeredEmail: "rohan.parent@outlook.com",
    kind: "STUDENT",
    phone: "+91 98450 20003",
  });

  const studentRohan = await prisma.student.upsert({
    where: { accountId: studentRohanAcc.id },
    update: {},
    create: {
      accountId: studentRohanAcc.id,
      admissionNumber: "ADM2026003",
      firstName: "Rohan",
      lastName: "Gupta",
      gender: "MALE",
      dateOfBirth: new Date("2011-03-09"),
      status: "ACTIVE",
      guardians: {
        create: {
          name: "Vikas Gupta",
          relation: "Father",
          phone: "+91 98450 20003",
          email: "rohan.parent@outlook.com",
          isPrimary: true,
        },
      },
    },
  });

  const enrollmentRohan = await prisma.enrollment.upsert({
    where: { studentId_academicYearId: { studentId: studentRohan.id, academicYearId: activeYear.id } },
    update: {},
    create: {
      studentId: studentRohan.id,
      academicYearId: activeYear.id,
      classId: class10.id,
      sectionId: sec10B.id,
      rollNumber: 1,
      status: "ACTIVE",
      startedOn: new Date("2026-04-01"),
      subjectsConfirmed: true,
      subjects: {
        create: [
          { classSubjectId: c10Math.id },
          { classSubjectId: c10Sci.id },
          { classSubjectId: c10Eng.id },
          { classSubjectId: c10Sst.id },
        ],
      },
    },
  });

  const rohanFeeAccount = await prisma.feeAccount.upsert({
    where: { studentId: studentRohan.id },
    update: {},
    create: { studentId: studentRohan.id },
  });

  await prisma.feeCharge.upsert({
    where: { id: "chg-rohan-t1" },
    update: {},
    create: {
      id: "chg-rohan-t1",
      feeAccountId: rohanFeeAccount.id,
      academicYearId: activeYear.id,
      feeHeadId: headTuition.id,
      label: "Term 1 (At Admission)",
      amount: D(25000),
      dueDate: new Date("2026-04-10"),
      mandatoryForAdmission: true,
      status: "ACTIVE",
    },
  });
  console.log("✓ Enrolled students configured: Aarav (10-A), Diya (10-A), Rohan (10-B)");

  // 8. Coursework & Physical Submissions
  await prisma.coursework.upsert({
    where: { id: "cw-math-10b-quadratic" },
    update: {},
    create: {
      id: "cw-math-10b-quadratic",
      offeringId: off10B_Math.id,
      title: "Quadratic Equations Problem Set 1",
      instructions: "Solve problems 1 through 15 from Chapter 4 in your standard textbook. Show all derivation steps.",
      kind: "HOMEWORK",
      status: "PUBLISHED",
      maxMarks: D(20),
      assignedOn: new Date("2026-08-18"),
      dueDate: new Date("2026-08-25"),
      publishedAt: new Date("2026-08-18"),
      createdBy: teacherJohn.id,
      submissions: {
        create: {
          enrollmentId: enrollmentRohan.id,
          status: "SUBMITTED",
          marks: D(18),
          recordedBy: teacherJohn.id,
          feedback: "Very clean step-by-step factoring.",
        },
      },
    },
  });

  await prisma.coursework.upsert({
    where: { id: "cw-sci-10a-chemistry" },
    update: {},
    create: {
      id: "cw-sci-10a-chemistry",
      offeringId: off10A_Sci.id,
      title: "Chemical Reactions Lab Observation Journal",
      instructions: "Submit written observations of displacement reactions with balanced molecular equations.",
      kind: "ASSIGNMENT",
      status: "PUBLISHED",
      maxMarks: D(25),
      assignedOn: new Date("2026-08-20"),
      dueDate: new Date("2026-08-28"),
      publishedAt: new Date("2026-08-20"),
      createdBy: teacherPriya.id,
      submissions: {
        create: [
          {
            enrollmentId: enrollmentAarav.id,
            status: "SUBMITTED",
            marks: D(24),
            recordedBy: teacherPriya.id,
            feedback: "Exceptional diagrams and reaction stoichiometry.",
          },
          {
            enrollmentId: enrollmentDiya.id,
            status: "SUBMITTED",
            marks: D(23),
            recordedBy: teacherPriya.id,
            feedback: "Well articulated results.",
          },
        ],
      },
    },
  });
  console.log("✓ Coursework and physical submissions recorded");

  // 9. Exams, Marks & Report Cards
  const midTermExam = await prisma.exam.upsert({
    where: { id: "exam-midterm-10" },
    update: {},
    create: {
      id: "exam-midterm-10",
      academicYearId: activeYear.id,
      classId: class10.id,
      name: "Mid-Term Examination 2026",
      scope: "CLASS_WIDE",
      category: "HALF_YEARLY",
      status: "PUBLISHED",
      publishedAt: new Date("2026-09-30"),
      createdBy: incharge10.id,
      papers: {
        create: [
          {
            id: "paper-10-math",
            classSubjectId: c10Math.id,
            maxMarks: D(100),
            passMarks: D(35),
            examDate: new Date("2026-09-18"),
          },
          {
            id: "paper-10-sci",
            classSubjectId: c10Sci.id,
            maxMarks: D(100),
            passMarks: D(35),
            examDate: new Date("2026-09-20"),
          },
        ],
      },
    },
    include: { papers: true },
  });

  const mathPaper = midTermExam.papers.find((p) => p.classSubjectId === c10Math.id)!;
  const sciPaper = midTermExam.papers.find((p) => p.classSubjectId === c10Sci.id)!;

  await prisma.examMark.createMany({
    data: [
      {
        paperId: mathPaper.id,
        enrollmentId: enrollmentAarav.id,
        marks: D(96),
        status: "ENTERED",
        enteredBy: teacherJohn.id,
      },
      {
        paperId: sciPaper.id,
        enrollmentId: enrollmentAarav.id,
        marks: D(94),
        status: "ENTERED",
        enteredBy: teacherPriya.id,
      },
      {
        paperId: mathPaper.id,
        enrollmentId: enrollmentDiya.id,
        marks: D(88),
        status: "ENTERED",
        enteredBy: teacherJohn.id,
      },
      {
        paperId: sciPaper.id,
        enrollmentId: enrollmentDiya.id,
        marks: D(91),
        status: "ENTERED",
        enteredBy: teacherPriya.id,
      },
      {
        paperId: mathPaper.id,
        enrollmentId: enrollmentRohan.id,
        marks: D(78),
        status: "ENTERED",
        enteredBy: teacherJohn.id,
      },
      {
        paperId: sciPaper.id,
        enrollmentId: enrollmentRohan.id,
        marks: D(72),
        status: "ENTERED",
        enteredBy: teacherPriya.id,
      },
    ],
    skipDuplicates: true,
  });

  // Report cards for Aarav & Diya
  await prisma.reportCard.upsert({
    where: {
      examId_enrollmentId_version: {
        examId: midTermExam.id,
        enrollmentId: enrollmentAarav.id,
        version: 1,
      },
    },
    update: {},
    create: {
      examId: midTermExam.id,
      enrollmentId: enrollmentAarav.id,
      version: 1,
      totalMarks: D(190),
      maxMarks: D(200),
      percentage: D(95),
      passed: true,
      publishedBy: incharge10.id,
      publishedAt: new Date("2026-09-30"),
      lines: {
        create: [
          {
            classSubjectId: c10Math.id,
            subjectName: "Mathematics",
            marks: D(96),
            maxMarks: D(100),
            passMarks: D(35),
            passed: true,
            status: "ENTERED",
          },
          {
            classSubjectId: c10Sci.id,
            subjectName: "Science",
            marks: D(94),
            maxMarks: D(100),
            passMarks: D(35),
            passed: true,
            status: "ENTERED",
          },
        ],
      },
    },
  });

  await prisma.reportCard.upsert({
    where: {
      examId_enrollmentId_version: {
        examId: midTermExam.id,
        enrollmentId: enrollmentDiya.id,
        version: 1,
      },
    },
    update: {},
    create: {
      examId: midTermExam.id,
      enrollmentId: enrollmentDiya.id,
      version: 1,
      totalMarks: D(179),
      maxMarks: D(200),
      percentage: D(89.5),
      passed: true,
      publishedBy: incharge10.id,
      publishedAt: new Date("2026-09-30"),
      lines: {
        create: [
          {
            classSubjectId: c10Math.id,
            subjectName: "Mathematics",
            marks: D(88),
            maxMarks: D(100),
            passMarks: D(35),
            passed: true,
            status: "ENTERED",
          },
          {
            classSubjectId: c10Sci.id,
            subjectName: "Science",
            marks: D(91),
            maxMarks: D(100),
            passMarks: D(35),
            passed: true,
            status: "ENTERED",
          },
        ],
      },
    },
  });
  console.log("✓ Mid-Term exams, paper marks, and published report cards generated");

  // 10. Daily Attendance Sheets
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sheet10A = await prisma.attendanceSheet.upsert({
    where: { sectionId_date: { sectionId: sec10A.id, date: today } },
    update: {},
    create: {
      sectionId: sec10A.id,
      date: today,
      submittedBy: teacherJohn.id,
    },
  });

  await prisma.attendanceRecord.createMany({
    data: [
      {
        sheetId: sheet10A.id,
        enrollmentId: enrollmentAarav.id,
        date: today,
        status: "PRESENT",
      },
      {
        sheetId: sheet10A.id,
        enrollmentId: enrollmentDiya.id,
        date: today,
        status: "PRESENT",
      },
    ],
    skipDuplicates: true,
  });

  const sheet10B = await prisma.attendanceSheet.upsert({
    where: { sectionId_date: { sectionId: sec10B.id, date: today } },
    update: {},
    create: {
      sectionId: sec10B.id,
      date: today,
      submittedBy: teacherJohn.id,
    },
  });

  await prisma.attendanceRecord.createMany({
    data: [
      {
        sheetId: sheet10B.id,
        enrollmentId: enrollmentRohan.id,
        date: today,
        status: "PRESENT",
      },
    ],
    skipDuplicates: true,
  });
  console.log("✓ Daily section attendance marked for Section 10-A and 10-B");

  // 11. System & Portal Notifications
  await prisma.notification.createMany({
    data: [
      {
        recipientId: studentAaravAcc.id,
        kind: "ACADEMIC_EXAM",
        title: "Mid-Term Examination Report Card Published",
        body: "Your Mid-Term results are published. Overall: 95.0% (Grade A1, Rank 1). Keep up the excellent work!",
        dedupeKey: "MIDTERM-AARAV",
        state: "OPEN",
      },
      {
        recipientId: studentRohanAcc.id,
        kind: "FEE_DUE",
        title: "Fee Reminder: Term 1 Installment",
        body: "Your Term 1 fee of ₹25,000 was due on 10 April 2026. Please settle dues at the Accounts office.",
        dedupeKey: "FEEREMINDER-ROHAN",
        state: "OPEN",
      },
      {
        recipientId: stakeholder.id,
        kind: "SYSTEM",
        title: "Academic Year 2026-27 Enrollment Update",
        body: "Class 10 enrollments have reached capacity targets. Financial clearance rate is 88%.",
        dedupeKey: "SYS-ENROLL-UPDATE",
        state: "OPEN",
      },
    ],
    skipDuplicates: true,
  });
  console.log("✓ Portal notifications sent");

  console.log("\n=======================================================");
  console.log("🎉 Seed complete! Default Login Credentials:");
  console.log("Password for all accounts: Password@123");
  console.log("-------------------------------------------------------");
  console.log("• Stakeholder:      stakeholder@school.edu");
  console.log("• Principal:        principal@school.edu");
  console.log("• Teacher Incharge: incharge10@school.edu  (Class 10)");
  console.log("• Multi-role Staff: teacher.john@school.edu (Head 10-A, Teaches 10-B Math)");
  console.log("• Subject Teacher:  teacher.priya@school.edu (Science 10-A & 10-B)");
  console.log("• Accounts:         accounts@school.edu");
  console.log("• Admissions:       admissions@school.edu");
  console.log("• Student 1:        ADM2026001 or student.aarav@school.edu");
  console.log("• Student 2:        ADM2026002 or student.diya@school.edu");
  console.log("• Student 3:        ADM2026003 or student.rohan@school.edu");
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
